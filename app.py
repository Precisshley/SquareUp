from flask import Flask, render_template, request, send_file, redirect, url_for
from flask_cors import CORS


import os
from PIL import Image
import qrcode
import io

from s3_functions import upload_file, show_image
from werkzeug.utils import secure_filename



app = Flask(__name__, template_folder='frontend')
cors = CORS(app,origins='*')

# Directory to store image pieces
UPLOAD_FOLDER = 'uploads'
PIECES_FOLDER = 'pieces'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PIECES_FOLDER, exist_ok=True)

BUCKET = "qrcode-employee-images"

# Store the state of which pieces have been served (in-memory for simplicity)
served_pieces = []

# Number of pieces in the grid (this example assumes a 3x3 grid for simplicity)
num_pieces = 9

# Path to the image that will be split
image_path = None

# Helper function to split the image into pieces
def split_image(image_path):
    image = Image.open(image_path)
    width, height = image.size

    # Calculate the dimensions of each piece (e.g., 3x3 grid)
    piece_width = width // 3
    piece_height = height // 3
    
    pieces = []
    
    for i in range(3):
        for j in range(3):
            left = j * piece_width
            upper = i * piece_height
            right = (j + 1) * piece_width
            lower = (i + 1) * piece_height
            piece = image.crop((left, upper, right, lower))
            piece_name = f"piece_{i}_{j}.png"
            piece_path = os.path.join(PIECES_FOLDER, piece_name)
            piece.save(piece_path)
            pieces.append(piece_name)
    
    return pieces

# Route to upload image
@app.route('/', methods=['GET', 'POST'])
def upload_image():
    global image_path
    if request.method == 'POST':
        file = request.files['file']
        if file:
            image_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(image_path)
            pieces = split_image(image_path)  # Split the image into pieces
            return redirect(url_for('generate_qr_code'))
    return render_template('upload.html')

# Route to generate QR code
@app.route('/generate_qr')
def generate_qr_code():
    # Generate the QR code pointing to the /qrcode route
    qr = qrcode.make(url_for('serve_piece', _external=True))
    buf = io.BytesIO()
    qr.save(buf)
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

# Route to serve image pieces
@app.route('/qrcode', methods=['GET', 'POST'])
def serve_piece():
    global served_pieces
    
    if request.method == 'POST':
        if 'file' in request.files:
            f = request.files['file']
            if f:
                # Get the current piece position (this will be the previous piece since it hasn't been added to served_pieces yet)
                current_piece = len(served_pieces) - 1  # Subtract 1 to get the current position
                filename = f"square_{current_piece//3}_{current_piece%3}.png"
                f.save(os.path.join(UPLOAD_FOLDER, filename))
                upload_file(f"uploads/{filename}", BUCKET)
                return redirect(url_for('serve_piece'))
    
    if len(served_pieces) < num_pieces:
        # Find the next unserved piece
        current_piece = len(served_pieces)
        piece_name = f"piece_{current_piece//3}_{current_piece%3}.png"
        served_pieces.append(piece_name)
        
        # Pass the current position to the template
        position = f"Position: Row {current_piece//3 + 1}, Column {current_piece%3 + 1}"
        return render_template('piece_upload.html', 
                             piece_path=piece_name,
                             position=position)
    
    return "All pieces have been served! Thank you for participating."


@app.route("/upload_square")
def upload_square():
    return render_template('upload_square.html')

@app.route("/upload", methods=['POST'])
def upload():
    if request.method == "POST":
        f = request.files['file']
        filename = secure_filename(f.filename)
        f.save(os.path.join(UPLOAD_FOLDER, filename))
        upload_file(f"uploads/{filename}", BUCKET)
        return redirect("/")
    
@app.route("/pics")
def list():
    contents = show_image(BUCKET)  # List all images
    # Organize the images into a 3x3 grid
    grid = [[None for _ in range(3)] for _ in range(3)]
    for item in contents:
        print(item)
        filename = item['Key']  # Get the filename from the S3 object
        if filename.startswith('uploads/square_'):
            # Parse row and column from filename
            parts = filename.split('_')
            if len(parts) >= 3:
                row = int(parts[1])
                col = int(parts[2].split('.')[0])
                grid[row][col] = item  # Store the entire item object
    
    return render_template('collection.html', grid=grid)

@app.route('/piece/<piece_name>')
def serve_piece_image(piece_name):
    return send_file(os.path.join(PIECES_FOLDER, piece_name), mimetype='image/png')

@app.route("/image/<filename>")
def get_image(filename):
    # Add the uploads/ prefix back before fetching from S3
    full_path = f"uploads/{filename}"
    image_data = show_image(BUCKET, full_path)
    return send_file(
        io.BytesIO(image_data),
        mimetype='image/png'
    )

if __name__ == '__main__':
    app.run(debug=True, port=8080)
