import cv2
import os
from insightface.app import FaceAnalysis

PERSON_NAME = "sample_user"
save_dir = f"face_db/{PERSON_NAME}"
os.makedirs(save_dir, exist_ok=True)

app = FaceAnalysis()
app.prepare(ctx_id=0)

cap = cv2.VideoCapture(0)

steps = [
    {"filename": "1_front.jpg", "label": "Step 1/3: 正面を向いて [s]キー"},
    {"filename": "2_right.jpg", "label": "Step 2/3: 少し右を向いて [s]キー"},
    {"filename": "3_left.jpg",  "label": "Step 3/3: 少し左を向いて [s]キー"}
]
current_step = 0

print(f"=== {PERSON_NAME} さんのマルチアングル顔登録を開始します ===")
while current_step < len(steps):
    ret, frame = cap.read()
    if not ret:
        break

    faces = app.get(frame)
    for face in faces:
        x1, y1, x2, y2 = face.bbox.astype(int)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

    instruction = steps[current_step]["label"]
    cv2.putText(frame, instruction, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    cv2.imshow("Multi-Angle Face Capture", frame)

    key = cv2.waitKey(1)
    if key == ord("s"):
        if len(faces) > 0:
            face = faces[0]
            x1, y1, x2, y2 = face.bbox.astype(int)
            h, w, _ = frame.shape
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            face_img = frame[y1:y2, x1:x2]

            if face_img.size > 0:
                filename = os.path.join(save_dir, steps[current_step]["filename"])
                cv2.imwrite(filename, face_img)
                print(f"保存成功: {filename}")
                current_step += 1
        else:
            print("顔が検出されませんでした。")

    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()