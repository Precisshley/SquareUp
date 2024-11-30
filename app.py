from flask import Flask, render_template, request, send_file, redirect, url_for
import os
from PIL import Image
import qrcode
import io

app = Flask(__name__, template_folder='frontend')

# Directory to store image pieces
UPLOAD_FOLDER = 'uploads'
PIECES_FOLDER = 'pieces'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PIECES_FOLDER, exist_ok=True)

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
@app.route('/qrcode')
def serve_piece():
    global served_pieces
    if len(served_pieces) < num_pieces:
        # Find the next unserved piece
        for i in range(num_pieces):
            if f"piece_{i//3}_{i%3}.png" not in served_pieces:
                served_pieces.append(f"piece_{i//3}_{i%3}.png")
                piece_path = os.path.join(PIECES_FOLDER, f"piece_{i//3}_{i%3}.png")
                return send_file(piece_path)
    
    return "All pieces have been served! Thank you for participating."

if __name__ == '__main__':
    app.run(debug=True)
