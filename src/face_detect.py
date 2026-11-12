# from insightface.app import FaceAnalysis

# app = FaceAnalysis()
# app.prepare(ctx_id=0)

# print("準備完了")
import time
import cv2
from insightface.app import FaceAnalysis

app = FaceAnalysis()
app.prepare(ctx_id=0)

cap = cv2.VideoCapture(0)

prev_time = time.time()

while True:

    ret, frame = cap.read()

    if not ret:
        break

    faces = app.get(frame)
    
    current_time = time.time()

    fps = 1 / (current_time - prev_time)

    prev_time = current_time

    for face in faces:

        x1, y1, x2, y2 = face.bbox.astype(int)

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            "Face",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )
        # cv2.putText(
        #     frame,
        #     f"FPS:{fps:.1f}",
        #     (20, 40),
        #     cv2.FONT_HERSHEY_SIMPLEX,
        #     1,
        #     (0, 0, 255),
        #     2
        # )
    # cv2.rectangle(
    #         frame,
    #         (x1, y1),
    #         (x2, y2),
    #         (0, 255, 0),
    #         2
    #     )

    cv2.imshow("Face Detection", frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()