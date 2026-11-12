from fastapi import FastAPI, Request, Body, Query
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import cv2
import base64
import numpy as np
import os
import sys
import subprocess

from insightface.app import FaceAnalysis
from src.recognition_engine import recognize_face, reload_embeddings
from src.database import init_db, save_stamp, get_logs, get_logs_by_month

app = FastAPI()

# 起動時にデータベースとFaceAnalysisを初期化
init_db()
face_app = FaceAnalysis()
face_app.prepare(ctx_id=0)

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def home(request: Request):
    # 打刻画面
    return templates.TemplateResponse(request=request, name="camera_stamp.html")

@app.post("/recognize")
async def recognize(data: dict = Body(...)):
    image = decode_image(data["image"])
    result = recognize_face(image)
    return result

def decode_image(base64_string):
    image_data = base64_string.split(",")[1]
    image_bytes = base64.b64decode(image_data)
    np_array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
    return image

@app.post("/stamp")
async def stamp(data: dict = Body(...)):
    save_stamp(data["name"], data["type"], data["score"], data["time"])
    return {"success": True}

@app.get("/logs")
async def logs_page(request: Request):
    logs = get_logs()
    return templates.TemplateResponse(
        request=request,
        name="emp_history.html",
        context={"request": request, "logs": logs}
    )

@app.get("/api/logs")
async def api_logs(year: int, month: int):
    logs = get_logs_by_month(year, month)
    result = []
    for row in logs:
        result.append({
            "name": row[0],
            "type": row[1],
            "score": row[2],
            "time": row[3]
        })
    return result

# ==========================================
# ウェブ顔登録 ＆ 向き（ポーズ）検知機能
# ==========================================
@app.get("/register_face_page")
async def register_face_page(request: Request):
    return templates.TemplateResponse(request=request, name="register_face.html")

@app.post("/api/save_face")
async def save_face(data: dict = Body(...)):
    name = data.get("name")
    image_base64 = data.get("image")
    pose_type = data.get("pose", "front") # "front", "right", "left"
    
    if not name or not image_base64:
        return {"success": False, "message": "名前または画像がありません"}
    
    try:
        image_data = image_base64.split(",")[1]
        image_bytes = base64.b64decode(image_data)
        np_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
        
        # 1. 顔の検出
        faces = face_app.get(image)
        if len(faces) == 0:
            return {"success": False, "message": "顔が検出されませんでした。カメラにしっかり顔を向けてください。"}
        if len(faces) > 1:
            return {"success": False, "message": "複数の顔が検出されました。1人で撮影してください。"}
        
        face = faces[0]
        
        # 2. 向き（ポーズ）の判定検知 (Yaw角を利用)
        if hasattr(face, 'pose') and face.pose is not None:
            _, yaw, _ = face.pose
            if pose_type == "front" and abs(yaw) > 18:
                return {"success": False, "message": "【エラー】正面を向いていません。まっすぐカメラを見てください。"}
            elif pose_type == "right" and yaw >= -12:
                return {"success": False, "message": "【エラー】右向きの角度が足りません。もう少し顔を右に向けてください。"}
            elif pose_type == "left" and yaw <= 12:
                return {"success": False, "message": "【エラー】左向きの角度が足りません。もう少し顔を左に向けてください。"}
        
        # 3. 保存処理
        save_dir = os.path.join("face_db", name)
        os.makedirs(save_dir, exist_ok=True)
        
        timestamp = int(os.times()[4] * 1000)
        filename = os.path.join(save_dir, f"{pose_type}_{timestamp}.jpg")
        cv2.imwrite(filename, image)
        
        return {"success": True, "message": "保存成功"}
        
    except Exception as e:
        return {"success": False, "message": f"エラーが発生しました: {str(e)}"}

@app.post("/api/train_faces")
async def train_faces():
    try:
        python_cmd = sys.executable
        result = subprocess.run([python_cmd, "src/register.py"], capture_output=True, text=True)
        if result.returncode == 0:
            reload_embeddings()
            return {"success": True, "message": "顔データの自動学習・更新が完了しました！"}
        else:
            return {"success": False, "message": f"学習エラー: {result.stderr}"}
    except Exception as e:
        return {"success": False, "message": f"実行エラー: {str(e)}"}