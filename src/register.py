import os
import cv2
import numpy as np
from insightface.app import FaceAnalysis

app = FaceAnalysis()
app.prepare(ctx_id=0)

FACE_DB = "face_db"
face_embeddings = []
face_names = []

for person_name in os.listdir(FACE_DB):
    person_dir = os.path.join(FACE_DB, person_name)
    if not os.path.isdir(person_dir):
        continue
    
    print(f"Processing {person_name}")
    for image_name in os.listdir(person_dir):
        image_path = os.path.join(person_dir, image_name)
        image = cv2.imread(image_path)
        if image is None:
            continue
        
        faces = app.get(image)
        if len(faces) == 0:
            print(f"No face found: {image_path}")
            continue
            
        face = faces[0]
        face_embeddings.append(face.embedding)
        face_names.append(person_name)
        print(f"Added: {image_path}")

os.makedirs("embeddings", exist_ok=True)
np.save("embeddings/face_embeddings.npy", np.array(face_embeddings))
np.save("embeddings/face_names.npy", np.array(face_names))

print(f"\n登録完了: {len(face_embeddings)} 件の顔特徴量を登録しました。")