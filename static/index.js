const fileInput = document.getElementById('file-upload');
const fileNameDisplay = document.getElementById('file-name');
const uploadForm = document.getElementById('uploadForm');
const resultDiv = document.getElementById('result');

fileInput.addEventListener('change',function(){
    if(fileInput.files.length > 0) {
        fileNameDisplay.textContent = fileInput.files[0].name;
    } else {
        fileNameDisplay.textContent = 'Ningun archivo seleccionado';
    }
});


uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    resultDiv.innerHTML = "<p>Procesando...</p>";
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (response.ok) {
            let html = `
                <h3>Metadatos de "${data.filename}":</h3>
                <ul>
                    <li><strong>Tipo:</strong> ${data.type}</li>
                    <li><strong>Tamaño:</strong> ${(data.size_bytes / 1024).toFixed(2)} KB</li>
                    <li><strong>Extensión:</strong> ${data.extension}</li>
            `;
            
            if (data.type === 'text') {
                html += `
                    <li><strong>Líneas:</strong> ${data.lines}</li>
                    <li><strong>Palabras:</strong> ${data.words}</li>
                    <li><strong>Caracteres:</strong> ${data.characters}</li>
                `;
                
                
                if (data.content) {
                    html += `
                        </ul>
                        <div class="text-content-box">
                            <div class="text-content-title">Contenido del archivo:</div>
                            ${data.content}
                        </div>
                    `;
                } else {
                    html += `</ul>`;
                }
            } else {
                html += `</ul>`;
            }
            
            resultDiv.innerHTML = html;
            

        } else {
            resultDiv.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
        }
    } catch (err) {
        resultDiv.innerHTML = `<p style="color: red;">Error de conexión: ${err.message}</p>`;
    }
});  

function solicitarPermisos() {
    //solicitar acceso a la camara
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {

            //si el acceso es concedido, se muestra el video
            
            let video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.style.maxWidth = '300px';
            video.style.marginTop = '20px';
            document.body.appendChild(video); // agrega el video al DOM
        })
        .catch(error => {
            console.log("error al acceder a la camara: ", error);
        });
    
    //verifica si el navegador soporta notificaciones
    if ("Notification" in window){
        Notification.requestPermission().then(permission => {
            if(permission === "granted") {
                //si el permiso es concedido, muestra la notificacion
                new Notification("Has concedidio el permiso para recibir notificaciones")
            }
        });
    } else {
        console.log("Este navegador no soporta notificaciones.");
    }
    
    //verifica si el navegador soporta la geolocation API
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            console.log("latitud: " + position.coords.latitude);
            console.log("longitud: " + position.coords.longitude);
        }, function(error){
            console.log("error al obtener la ubicacion:",error);
        });
        }else{
            console.log("la geolocalizacion no esta disponible para este navegador");
    }
};

const cameraButton = document.getElementById('camera-button');
const cameraContainer = document.getElementById('camera-container');
const video = document.getElementById('video');
const captureButton = document.getElementById('capture-button');
const canvas = document.getElementById('canvas');

let videoStream = null;

// Mostrar cámara
cameraButton.addEventListener('click', async () => {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = videoStream;
    cameraContainer.style.display = 'block';
    video.style.display = 'block';
    canvas.style.display = 'none'; // Ocultamos el canvas por si ya había algo
  } catch (err) {
    alert('No se pudo acceder a la cámara: ' + err.message);
  }
});

// Capturar imagen
captureButton.addEventListener('click', () => {
  if (!videoStream) {
    alert('Cámara no activa');
    return;
  }

  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Detener cámara
  videoStream.getTracks().forEach(track => track.stop());
  videoStream = null;

  // Mostrar imagen capturada
  video.style.display = 'none';
  canvas.style.display = 'block';

  // Enviar imagen capturada como archivo
  canvas.toBlob(blob => {
    const file = new File([blob], "foto_capturada.png", { type: "image/png" });
    const formData = new FormData();
    formData.append('file', file);

    resultDiv.innerHTML = "<p>Procesando imagen capturada...</p>";

    fetch('/upload', {
      method: 'POST',
      body: formData
    })
    .then(resp => resp.json())
    .then(data => {
      if (data.filename) {
        resultDiv.innerHTML = `
          <h3>Imagen procesada: ${data.filename}</h3>
          <p><strong>Tamaño:</strong> ${(data.size_bytes / 1024).toFixed(2)} KB</p>
          <p><strong>Tipo:</strong> ${data.type}</p>
        `;
      } else {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
      }
    })
    .catch(err => {
      resultDiv.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
    });
  }, 'image/png');
});