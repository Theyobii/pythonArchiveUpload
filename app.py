from flask import Flask, request, jsonify, render_template, send_file #type: ignore
import os
from werkzeug.utils import secure_filename # type: ignore
import filetype   # type: ignore

app = Flask(__name__)

#tipo de archivos permitidos
ALLOWED_EXTENSIONS = {'txt', 'png', 'jpg', 'jpeg', 'pdf', 'docx'}  # Extensions allowed


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

#Obtiene metadatos basicos de los archivos
def get_file_metadata(file):

    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    
    return {
        'filename': secure_filename(file.filename),
        'content_type': file.content_type,
        'size_bytes': size,
        'extension': file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else None
    }

#Procesa archivos de texto
def analyze_text(file):

    try:
        content = file.read().decode('utf-8')
    except UnicodeDecodeError:
        file.seek(0)
        content = file.read().decode('latin-1')
    
    lines = content.split('\n')
    words = content.split()
    
    metadata = get_file_metadata(file)
    metadata.update({
        'lines': len(lines),
        'words': len(words),
        'characters': len(content),
        'type': 'text',
        'content': content  
    })
    return metadata

#ruta para mostrar formulario
@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

#ruta para obtener formulario
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No se subió ningún archivo"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nombre de archivo vacío"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": f"Extensión no permitida. Use: {', '.join(ALLOWED_EXTENSIONS)}"}), 415
    
    # Determinar tipo de archivo
    file_type = filetype.guess(file.stream)
    file.stream.seek(0)
    
    if file.filename.lower().endswith('.txt'):
            result = analyze_text(file)
    else:
            result = get_file_metadata(file)
            
            
            if file_type is not None:
                result['type'] = file_type.mime.split('/')[0]  
                result['mime_type'] = file_type.mime
                result['extension'] = file_type.extension
            else:
                result['type'] = 'other'
    
    return jsonify(result)
  
  

if __name__ == '__main__':
    app.run(debug=True)