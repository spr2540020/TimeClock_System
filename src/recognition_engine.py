import cv2
import numpy as np
from insightface.app import FaceAnalysis
from src.utils import cosine_similarity

THRESHOLD = 0.75

app = FaceAnalysis()
app.prepare(ctx_id=0)

embeddings = None
names = None

def reload_embeddings():
    global embeddings, names
    try:
        embeddings = np.load("embeddings/face_embeddings.npy", allow_pickle=True)
        names = np.load("embeddings/face_names.npy", allow_pickle=True)
        print(f"[Info] 顔特徴量を再ロードしました ({len(embeddings)} 件)")
    except Exception as e:
        print(f"[Warning] 特徴量ファイルのロードに失敗しました: {e}")

# 起動時に一回ロード
reload_embeddings()

def recognize_face(image):
    global embeddings, names
    if embeddings is None or len(embeddings) == 0:
        return {"success": False, "message": "no_registered_faces"}

    faces = app.get(image)
    if len(faces) == 0:
        return {"success": False, "message": "face_not_found"}
        
    face = faces[0]
    embedding = face.embedding
    
    best_score = -1
    best_name = "Unknown"
    
    for db_embedding, db_name in zip(embeddings, names):
        score = cosine_similarity(embedding, db_embedding)
        if score > best_score:
            best_score = score
            best_name = db_name
            
    if best_score < THRESHOLD:
        return {"success": False, "message": "unknown"}
        
    return {
        "success": True,
        "name": str(best_name),
        "score": float(best_score)
    }