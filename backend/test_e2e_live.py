import httpx
import sys

BASE = 'http://127.0.0.1:8000'

def test_full_workflow():
    client = httpx.Client(base_url=BASE, timeout=10.0)

    # 1. Login as Teacher
    t_res = client.post('/auth/login', json={'email': 'teacher@example.com', 'password': 'Teacher123!'})
    assert t_res.status_code == 200, f'Teacher login failed: {t_res.text}'
    t_token = t_res.json()['access_token']
    t_headers = {'Authorization': f'Bearer {t_token}'}
    print('[+] Teacher login successful')

    # 2. Teacher creates an AI generated quiz
    gen_res = client.post('/quiz/generate', json={
        'topic': 'Cloud Computing & Microservices',
        'difficulty': 'medium',
        'num_questions': 3,
        'title': 'Cloud & DevOps Mastery',
        'duration_minutes': 10
    }, headers=t_headers)
    assert gen_res.status_code == 200, f'Quiz generation failed: {gen_res.text}'
    quiz_data = gen_res.json()
    quiz_id = quiz_data['id']
    print(f'[+] AI Quiz generated successfully (ID: {quiz_id}) with {quiz_data["question_count"]} questions')

    # 3. Publish Quiz
    pub_res = client.post(f'/quiz/{quiz_id}/publish', headers=t_headers)
    assert pub_res.status_code == 200
    print('[+] Quiz published successfully')

    # 4. Login as Student
    s_res = client.post('/auth/login', json={'email': 'student@example.com', 'password': 'Student123!'})
    assert s_res.status_code == 200
    s_token = s_res.json()['access_token']
    s_headers = {'Authorization': f'Bearer {s_token}'}
    print('[+] Student login successful')

    # 5. Student fetches quizzes
    sq_res = client.get('/student/quizzes', headers=s_headers)
    assert sq_res.status_code == 200
    print(f'[+] Student fetched {len(sq_res.json())} available quizzes')

    # 6. Student starts the newly created quiz
    start_res = client.post(f'/quiz/{quiz_id}/start', headers=s_headers)
    assert start_res.status_code == 200
    start_data = start_res.json()
    attempt_id = start_data['attempt_id']
    print(f'[+] Student started quiz attempt (ID: {attempt_id})')

    # 7. Student submits answers
    questions = start_data['questions']
    answers = {str(q['id']): q['options'][0] for q in questions}
    sub_res = client.post(f'/quiz/{quiz_id}/submit', json={'answers': answers}, headers=s_headers)
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    print(f'[+] Quiz submitted! Score: {sub_data["score"]}/{sub_data["total_questions"]} ({sub_data["percentage"]}%)')

    # 8. Check result details
    rev_res = client.get(f'/student/results/{attempt_id}', headers=s_headers)
    assert rev_res.status_code == 200
    print(f'[+] Result review retrieved with {len(rev_res.json()["questions"])} question explanations')

    # 9. Check Leaderboard
    lb_res = client.get('/leaderboard', headers=s_headers)
    assert lb_res.status_code == 200
    print(f'[+] Leaderboard retrieved with {len(lb_res.json())} ranked students')

    # 10. Admin Stats
    a_res = client.post('/auth/login', json={'email': 'admin@example.com', 'password': 'Admin123!'})
    assert a_res.status_code == 200
    a_token = a_res.json()['access_token']
    stats_res = client.get('/admin/statistics', headers={'Authorization': f'Bearer {a_token}'})
    assert stats_res.status_code == 200
    print(f'[+] Admin platform statistics: {stats_res.json()}')

    print('\n======================================================')
    print(' ALL FULL-STACK LMS ENDPOINTS TESTED & OPERATIONAL!')
    print('======================================================')

if __name__ == '__main__':
    test_full_workflow()
