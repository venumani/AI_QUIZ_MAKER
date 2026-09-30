from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.class_model import Class, ClassStudent
from app.models.pdf import PDFDocument
from app.models.quiz import Quiz, QuizAssignment
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptAnswer
from app.dependencies import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if admin already exists
    if db.query(User).filter(User.email == "admin@example.com").first():
        print("Database already seeded.")
        db.close()
        return

    print("Seeding initial data...")

    # 1. Create Users
    admin = User(
        name="Admin System",
        email="admin@example.com",
        password_hash=get_password_hash("Admin123!"),
        role="admin"
    )
    teacher = User(
        name="Prof. Alan Turing",
        email="teacher@example.com",
        password_hash=get_password_hash("Teacher123!"),
        role="teacher"
    )
    student1 = User(
        name="Ada Lovelace",
        email="student@example.com",
        password_hash=get_password_hash("Student123!"),
        role="student"
    )
    student2 = User(
        name="John von Neumann",
        email="john@example.com",
        password_hash=get_password_hash("Student123!"),
        role="student"
    )
    student3 = User(
        name="Grace Hopper",
        email="grace@example.com",
        password_hash=get_password_hash("Student123!"),
        role="student"
    )

    db.add_all([admin, teacher, student1, student2, student3])
    db.commit()
    db.refresh(teacher)
    db.refresh(student1)
    db.refresh(student2)
    db.refresh(student3)

    # 2. Create Classes
    class_cs = Class(
        class_name="Computer Science 101",
        subject="Algorithms & Data Structures",
        academic_year="2026-27",
        teacher_id=teacher.id
    )
    class_ai = Class(
        class_name="AI & Machine Learning",
        subject="Artificial Intelligence",
        academic_year="2026-27",
        teacher_id=teacher.id
    )
    db.add_all([class_cs, class_ai])
    db.commit()
    db.refresh(class_cs)
    db.refresh(class_ai)

    # 3. Enroll Students in Classes
    db.add_all([
        ClassStudent(class_id=class_cs.id, student_id=student1.id),
        ClassStudent(class_id=class_cs.id, student_id=student2.id),
        ClassStudent(class_id=class_cs.id, student_id=student3.id),
        ClassStudent(class_id=class_ai.id, student_id=student1.id),
        ClassStudent(class_id=class_ai.id, student_id=student2.id),
    ])
    db.commit()

    # 4. Create Sample PDF
    sample_pdf = PDFDocument(
        title="Introduction to Artificial Intelligence & Neural Networks",
        filename="ai_overview_lecture_1.pdf",
        file_path="",
        extracted_text="Artificial intelligence (AI) is the intelligence of machines or software, as opposed to the intelligence of living beings, primarily of humans. Machine learning is an important branch of AI that focuses on building applications that learn from data and improve their accuracy over time without being programmed to do so. Deep learning is a subset of machine learning based on artificial neural networks.",
        file_size=1048576,
        page_count=12,
        teacher_id=teacher.id
    )
    db.add(sample_pdf)
    db.commit()
    db.refresh(sample_pdf)

    # 5. Create Sample Quizzes
    quiz1 = Quiz(
        title="AI & Neural Networks Fundamentals",
        description="Comprehensive quiz covering the fundamentals of Artificial Intelligence, Deep Learning, and Neural Networks.",
        topic="Artificial Intelligence",
        difficulty="medium",
        duration_minutes=15,
        status="published",
        teacher_id=teacher.id,
        pdf_id=sample_pdf.id
    )
    quiz2 = Quiz(
        title="Data Structures & Big-O Notation",
        description="Test your knowledge on algorithmic complexity, trees, graphs, and hash tables.",
        topic="Computer Science",
        difficulty="hard",
        duration_minutes=20,
        status="published",
        teacher_id=teacher.id,
        pdf_id=None
    )
    quiz3 = Quiz(
        title="Python Programming Mastery",
        description="Draft quiz evaluating Python 3.12 syntax, list comprehensions, and generators.",
        topic="Python",
        difficulty="easy",
        duration_minutes=10,
        status="draft",
        teacher_id=teacher.id,
        pdf_id=None
    )
    db.add_all([quiz1, quiz2, quiz3])
    db.commit()
    db.refresh(quiz1)
    db.refresh(quiz2)
    db.refresh(quiz3)

    # 6. Add Questions to Quiz 1
    q1_1 = Question(
        quiz_id=quiz1.id,
        question_text="What is the primary difference between Machine Learning (ML) and Deep Learning (DL)?",
        options=[
            "Deep Learning uses artificial neural networks with multiple layers, while traditional ML often relies on simpler algorithms",
            "Deep Learning only works on text data, whereas ML only processes numbers",
            "Machine Learning requires no data, while Deep Learning requires human intervention for every computation",
            "There is no difference between ML and Deep Learning"
        ],
        correct_answer="Deep Learning uses artificial neural networks with multiple layers, while traditional ML often relies on simpler algorithms",
        explanation="Deep learning is a subset of ML distinguished by its multi-layered artificial neural network architecture.",
        order_num=1
    )
    q1_2 = Question(
        quiz_id=quiz1.id,
        question_text="Which activation function is most commonly used in hidden layers of modern deep neural networks to prevent vanishing gradients?",
        options=[
            "ReLU (Rectified Linear Unit)",
            "Sigmoid Function",
            "Linear Identity Function",
            "Step Function"
        ],
        correct_answer="ReLU (Rectified Linear Unit)",
        explanation="ReLU computes max(0, x), which avoids vanishing gradients for positive inputs and is computationally very efficient.",
        order_num=2
    )
    q1_3 = Question(
        quiz_id=quiz1.id,
        question_text="What technique is primarily used to prevent overfitting in neural networks by randomly deactivating neurons during training?",
        options=[
            "Dropout",
            "Gradient Descent",
            "Backpropagation",
            "Batch Normalization"
        ],
        correct_answer="Dropout",
        explanation="Dropout randomly sets a fraction of input units to 0 at each update during training time, which helps prevent overfitting.",
        order_num=3
    )
    q1_4 = Question(
        quiz_id=quiz1.id,
        question_text="What is the purpose of the loss function in a machine learning model?",
        options=[
            "To quantify the difference between the model's prediction and the actual ground truth",
            "To speed up the internet connection during training",
            "To compress the dataset into a smaller format",
            "To automatically label unannotated training data"
        ],
        correct_answer="To quantify the difference between the model's prediction and the actual ground truth",
        explanation="The loss function computes the penalty for wrong predictions, providing a signal for optimization algorithms.",
        order_num=4
    )

    # Questions for Quiz 2
    q2_1 = Question(
        quiz_id=quiz2.id,
        question_text="What is the average time complexity for searching an element in a balanced Binary Search Tree (BST)?",
        options=[
            "O(log n)",
            "O(n)",
            "O(1)",
            "O(n^2)"
        ],
        correct_answer="O(log n)",
        explanation="In a balanced BST, each comparison cuts the search space in half, resulting in O(log n) time complexity.",
        order_num=1
    )
    q2_2 = Question(
        quiz_id=quiz2.id,
        question_text="Which data structure operates on a Last-In, First-Out (LIFO) principle?",
        options=[
            "Stack",
            "Queue",
            "Binary Heap",
            "Linked List"
        ],
        correct_answer="Stack",
        explanation="A Stack is a LIFO data structure where the last item pushed is the first one popped.",
        order_num=2
    )

    db.add_all([q1_1, q1_2, q1_3, q1_4, q2_1, q2_2])
    db.commit()

    # 7. Assign Quiz 1 to Classes
    db.add_all([
        QuizAssignment(quiz_id=quiz1.id, class_id=class_ai.id, due_date=datetime.utcnow() + timedelta(days=7)),
        QuizAssignment(quiz_id=quiz2.id, class_id=class_cs.id, due_date=datetime.utcnow() + timedelta(days=10))
    ])
    db.commit()

    # 8. Create Sample Completed Attempts for Leaderboard
    # Student 1: 100%
    att1 = QuizAttempt(
        quiz_id=quiz1.id,
        student_id=student1.id,
        score=4.0,
        total_questions=4,
        correct_answers=4,
        percentage=100.0,
        status="completed",
        started_at=datetime.utcnow() - timedelta(hours=3),
        submitted_at=datetime.utcnow() - timedelta(hours=2, minutes=50)
    )
    # Student 2: 75%
    att2 = QuizAttempt(
        quiz_id=quiz1.id,
        student_id=student2.id,
        score=3.0,
        total_questions=4,
        correct_answers=3,
        percentage=75.0,
        status="completed",
        started_at=datetime.utcnow() - timedelta(hours=2),
        submitted_at=datetime.utcnow() - timedelta(hours=1, minutes=48)
    )
    # Student 3: 50%
    att3 = QuizAttempt(
        quiz_id=quiz1.id,
        student_id=student3.id,
        score=2.0,
        total_questions=4,
        correct_answers=2,
        percentage=50.0,
        status="completed",
        started_at=datetime.utcnow() - timedelta(hours=1),
        submitted_at=datetime.utcnow() - timedelta(minutes=45)
    )

    db.add_all([att1, att2, att3])
    db.commit()
    db.refresh(att1)
    db.refresh(att2)
    db.refresh(att3)

    # Add answers for att1
    db.add_all([
        AttemptAnswer(attempt_id=att1.id, question_id=q1_1.id, selected_option=q1_1.correct_answer, is_correct=True),
        AttemptAnswer(attempt_id=att1.id, question_id=q1_2.id, selected_option=q1_2.correct_answer, is_correct=True),
        AttemptAnswer(attempt_id=att1.id, question_id=q1_3.id, selected_option=q1_3.correct_answer, is_correct=True),
        AttemptAnswer(attempt_id=att1.id, question_id=q1_4.id, selected_option=q1_4.correct_answer, is_correct=True),
    ])
    db.commit()

    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
