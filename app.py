from flask import Flask, render_template, request, send_file, redirect, url_for, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, disconnect
from engineio.payload import Payload

import os
from PIL import Image
import qrcode
import io
from datetime import datetime

from s3_functions import upload_file, show_image
from werkzeug.utils import secure_filename

# Increase max payload size
Payload.max_decode_packets = 50

# Track active connections with more information
active_connections = {}

app = Flask(__name__, template_folder='frontend')
cors = CORS(app, origins='*', supports_credentials=True)
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    ping_timeout=20,
    ping_interval=25,
    max_http_buffer_size=10e6,
    async_mode='threading'  # Use threading mode
)

# Directory to store image pieces
PIECES_FOLDER = 'pieces'
os.makedirs(PIECES_FOLDER, exist_ok=True)

UPLOADS_FOLDER = 'uploads'
os.makedirs(UPLOADS_FOLDER, exist_ok=True)

BUCKET = "qrcode-employee-images"

# Store the state of which pieces have been served (in-memory for simplicity)
served_pieces = []
grid_size = 5  # Default value, will be updated when image is uploaded

# Path to the image that will be split
image_path = None

# Helper function to split the image into pieces
def split_image(image_path, grid_size):
    image = Image.open(image_path)
    
    # Resize the original image to a standard size (e.g., 900x900)
    STANDARD_SIZE = (900, 900)
    image = image.resize(STANDARD_SIZE, Image.Resampling.LANCZOS)
    
    width, height = image.size
    piece_width = width // grid_size
    piece_height = height // grid_size
    
    pieces = []
    
    for i in range(grid_size):
        for j in range(grid_size):
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
    global grid_size
    
    if request.method == 'POST':
        file = request.files['file']
        # Add logging
        print("Form data received:", request.form)
        grid_size = int(request.form.get('gridSize', 5))  # Get grid size from form data
        print(f"Setting grid size to: {grid_size}")
        
        if file:
            # Create a standard size image from the upload
            image = Image.open(file.stream)
            STANDARD_SIZE = (900, 900)
            image = image.resize(STANDARD_SIZE, Image.Resampling.LANCZOS)
            
            width, height = image.size
            piece_width = width // grid_size
            piece_height = height // grid_size
            
            for i in range(grid_size):
                for j in range(grid_size):
                    left = j * piece_width
                    upper = i * piece_height
                    right = (j + 1) * piece_width
                    lower = (i + 1) * piece_height
                    piece = image.crop((left, upper, right, lower))
                    # Calculate piece size based on grid
                    piece_size = 900 // grid_size
                    piece = piece.resize((piece_size, piece_size), Image.Resampling.LANCZOS)
                    piece_name = f"piece_{i}_{j}.png"
                    piece_path = os.path.join(PIECES_FOLDER, piece_name)
                    piece.save(piece_path)
            
            return redirect(url_for('generate_qr_code'))
    return render_template('upload.html')

# Route to generate QR code
@app.route('/generate_qr')
def generate_qr_code():
    # Generate the QR code pointing to the frontend /image route
    frontend_url = "https://square-up-pearl.vercel.app/image"
    qr = qrcode.make(frontend_url)
    buf = io.BytesIO()
    qr.save(buf)
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

# Route to serve image pieces
@app.route('/qrcode', methods=['GET', 'POST'])
def serve_piece():
    global served_pieces, grid_size
    
    if request.method == 'POST':
        if 'file' in request.files:
            f = request.files['file']
            if f:
                # Get the last served piece name and extract its position
                if not served_pieces:
                    return jsonify({'error': 'No piece has been served yet'}), 400
                
                last_piece = served_pieces[-1]
                # Extract row and col from the piece name (format: piece_row_col.png)
                row_col = last_piece.replace('piece_', '').replace('.png', '').split('_')
                row = int(row_col[0])
                col = int(row_col[1])
                
                print(f"Uploading piece for position: {row}_{col}")
                filename = f"square_{row}_{col}.png"
                
                f.save(os.path.join(UPLOADS_FOLDER, filename))
                upload_file(f"uploads/{filename}", BUCKET)
                
                return jsonify({'success': True})
    
    # For GET requests, serve the next piece
    if len(served_pieces) >= grid_size * grid_size:
        return jsonify({
            'error': 'all_pieces_served',
            'message': "All pieces have been served! Please upload a new image to start over."
        }), 400
    
    current_piece = len(served_pieces)
    row = current_piece // grid_size
    col = current_piece % grid_size
    print(f"GET request - Serving piece at position: {row}_{col}")
    
    piece_name = f"piece_{row}_{col}.png"
    served_pieces.append(piece_name)
    
    position = f"Position: Row {row + 1}, Column {col + 1}"
    
    return jsonify({
        'piece_path': piece_name,
        'position': position,
        'uploaded_path': f"square_{row}_{col}.png" 
        if os.path.exists(os.path.join(PIECES_FOLDER, f"square_{row}_{col}.png")) 
        else None
    })


@app.route("/upload_square")
def upload_square():
    return render_template('upload_square.html')

@app.route("/upload", methods=['POST'])
def upload():
    if request.method == "POST":
        f = request.files['file']
        filename = secure_filename(f.filename)
        f.save(os.path.join(PIECES_FOLDER, filename))
        upload_file(f"uploads/{filename}", BUCKET)
        return redirect("/")
    
@app.route("/pics")
def list():
    contents = show_image(BUCKET)
    # Initialize a grid based on grid_size
    grid = [[None for _ in range(grid_size)] for _ in range(grid_size)]
    
    for item in contents:
        filename = item['Key']
        if filename.startswith('uploads/square_'):
            try:
                parts = filename.split('_')
                if len(parts) >= 3:
                    row = int(parts[1])
                    col = int(parts[2].split('.')[0])
                    if 0 <= row < grid_size and 0 <= col < grid_size:
                        grid[row][col] = item
            except (IndexError, ValueError) as e:
                print(f"Error processing filename {filename}: {str(e)}")
                continue
    
    return jsonify({'grid': grid})

@app.route('/piece/<piece_name>')
def serve_piece_image(piece_name):
    return send_file(os.path.join(PIECES_FOLDER, piece_name), mimetype='image/png')

@app.route("/image/<filename>")
def get_image(filename):
    # Add the uploads/ prefix back before fetching from S3
    full_path = f"uploads/{filename}"
    image_data = show_image(BUCKET, full_path)
    response = send_file(
        io.BytesIO(image_data),
        mimetype='image/png'
    )
    # Set headers for a short cache with revalidation
    response.headers['Cache-Control'] = 'no-cache, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/reset', methods=['POST'])
def reset_pieces():
    global served_pieces, image_path
    served_pieces = []  # Reset the served pieces list
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    if file:
        # Save the new image
        filename = secure_filename(file.filename)
        image_path = os.path.join(PIECES_FOLDER, filename)
        file.save(image_path)
        
        # Split the new image into pieces
        split_image(image_path, grid_size)
        
        return jsonify({'success': True})
    
    return jsonify({'error': 'Invalid file'}), 400

@socketio.on('connect')
def handle_connect():
    sid = request.sid
    if sid in active_connections:
        print(f"Duplicate connection attempt from {sid}")
        disconnect(sid)
        return False
    
    active_connections[sid] = {
        'connected_at': datetime.now().isoformat(),
        'client_ip': request.remote_addr
    }
    print(f"Client {sid} connected. Active connections: {len(active_connections)}")
    return True

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid in active_connections:
        del active_connections[sid]
        print(f"Client {sid} disconnected. Active connections: {len(active_connections)}")

# Add error handler
@socketio.on_error()
def error_handler(e):
    print(f"SocketIO error: {str(e)}")
    sid = request.sid
    if sid in active_connections:
        del active_connections[sid]

# Add this new route
@app.route('/combined-image')
def get_combined_image():
    try:
        # Get all images from S3 bucket
        contents = show_image(BUCKET)
        if not contents:
            return jsonify({'error': 'No images found'}), 400

        # Calculate grid dimensions based on the uploaded squares
        max_row = max_col = -1
        valid_pieces = []
        
        # First pass: determine grid size from filenames
        for item in contents:
            filename = item['Key']
            if filename.startswith('uploads/square_'):
                try:
                    parts = filename.split('_')
                    if len(parts) >= 3:
                        row = int(parts[1])
                        col = int(parts[2].split('.')[0])
                        max_row = max(max_row, row)
                        max_col = max(max_col, col)
                        valid_pieces.append((row, col, filename))
                except (IndexError, ValueError) as e:
                    print(f"Error parsing filename {filename}: {e}")
                    continue

        if max_row == -1 or max_col == -1:
            return jsonify({'error': 'No valid image pieces found'}), 400

        # Use the larger of the dimensions to ensure square grid
        actual_grid_size = max(max_row + 1, max_col + 1)
        piece_size = 900 // actual_grid_size

        # Create a new blank image
        combined_image = Image.new('RGB', (900, 900), 'white')

        # Second pass: place the images
        for row, col, filename in valid_pieces:
            try:
                image_data = show_image(BUCKET, filename)
                piece = Image.open(io.BytesIO(image_data))
                # Resize piece to fit the grid
                piece = piece.resize((piece_size, piece_size), Image.Resampling.LANCZOS)
                # Calculate position
                x = col * piece_size
                y = row * piece_size
                combined_image.paste(piece, (x, y))
            except Exception as e:
                print(f"Error processing piece {filename}: {e}")
                continue

        # Save the combined image
        buf = io.BytesIO()
        combined_image.save(buf, format='PNG', optimize=True)
        buf.seek(0)

        response = send_file(
            buf,
            mimetype='image/png',
            as_attachment=True,
            download_name='community-mosaic.png'
        )
        
        # Set cache control headers
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
        return response

    except Exception as e:
        print(f"Error generating combined image: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    socketio.run(
        app,
        debug=True,
        port=8080,
        allow_unsafe_werkzeug=True,
        use_reloader=False  # Disable reloader to prevent duplicate connections
    )
