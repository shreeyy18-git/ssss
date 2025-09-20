import requests
import sys
import json
from datetime import datetime

class DisasterPreparednessAPITester:
    def __init__(self, base_url="https://learnanalytics-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.teacher_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user = None
        self.teacher_user = None
        self.student_user = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_authentication(self):
        """Test authentication for all user types"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        # Test admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user = response['user']
            print(f"Admin user: {self.admin_user['full_name']} ({self.admin_user['role']})")
        
        # Test teacher login
        success, response = self.run_test(
            "Teacher Login",
            "POST",
            "/auth/login",
            200,
            data={"username": "teacher1", "password": "teacher123"}
        )
        if success and 'access_token' in response:
            self.teacher_token = response['access_token']
            self.teacher_user = response['user']
            print(f"Teacher user: {self.teacher_user['full_name']} ({self.teacher_user['role']})")
        
        # Test student login
        success, response = self.run_test(
            "Student Login",
            "POST",
            "/auth/login",
            200,
            data={"username": "student1", "password": "student123"}
        )
        if success and 'access_token' in response:
            self.student_token = response['access_token']
            self.student_user = response['user']
            print(f"Student user: {self.student_user['full_name']} ({self.student_user['role']})")
        
        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "/auth/login",
            401,
            data={"username": "invalid", "password": "invalid"}
        )
        
        # Test /auth/me endpoint
        if self.admin_token:
            self.run_test(
                "Admin Auth Me",
                "GET",
                "/auth/me",
                200,
                token=self.admin_token
            )

    def test_user_management(self):
        """Test user management endpoints"""
        print("\n" + "="*50)
        print("TESTING USER MANAGEMENT")
        print("="*50)
        
        if not self.admin_token:
            print("❌ Skipping user management tests - no admin token")
            return
        
        # Test get users (admin only)
        self.run_test(
            "Get All Users (Admin)",
            "GET",
            "/users",
            200,
            token=self.admin_token
        )
        
        # Test get users with student token (should fail)
        if self.student_token:
            self.run_test(
                "Get All Users (Student - Should Fail)",
                "GET",
                "/users",
                403,
                token=self.student_token
            )

    def test_quiz_system(self):
        """Test quiz-related endpoints"""
        print("\n" + "="*50)
        print("TESTING QUIZ SYSTEM")
        print("="*50)
        
        if not self.student_token:
            print("❌ Skipping quiz tests - no student token")
            return
        
        # Get available quizzes
        success, quizzes = self.run_test(
            "Get Quizzes",
            "GET",
            "/quizzes",
            200,
            token=self.student_token
        )
        
        if success and quizzes:
            quiz = quizzes[0]
            print(f"Found quiz: {quiz['title']} with {len(quiz['questions'])} questions")
            
            # Submit a quiz attempt
            quiz_attempt = {
                "quiz_id": quiz['id'],
                "module_id": quiz['module_id'],  # Add missing module_id
                "score": 2,
                "total_questions": len(quiz['questions']),
                "answers": [
                    {
                        "question": quiz['questions'][0]['question'],
                        "user_answer": 1,
                        "correct_answer": quiz['questions'][0]['correct'],
                        "is_correct": True
                    }
                ]
            }
            
            self.run_test(
                "Submit Quiz Attempt",
                "POST",
                "/quiz-attempts",
                200,
                data=quiz_attempt,
                token=self.student_token
            )
            
            # Get quiz attempts for student
            if self.student_user:
                self.run_test(
                    "Get Student Quiz Attempts",
                    "GET",
                    f"/quiz-attempts/{self.student_user['id']}",
                    200,
                    token=self.student_token
                )

    def test_drill_system(self):
        """Test drill participation endpoints"""
        print("\n" + "="*50)
        print("TESTING DRILL SYSTEM")
        print("="*50)
        
        if not self.student_token or not self.student_user:
            print("❌ Skipping drill tests - no student token/user")
            return
        
        # Record drill participation
        drill_types = ["Fire Drill", "Earthquake Drill", "Flood Evacuation Drill", "Lockdown Drill"]
        
        for drill_type in drill_types:
            drill_data = {
                "drill_type": drill_type,
                "notes": f"Participated in {drill_type}"
            }
            
            self.run_test(
                f"Record {drill_type} Participation",
                "POST",
                "/drills",
                200,
                data=drill_data,
                token=self.student_token
            )
        
        # Get drill participations
        self.run_test(
            "Get Student Drill Participations",
            "GET",
            f"/drills/{self.student_user['id']}",
            200,
            token=self.student_token
        )

    def test_alert_system(self):
        """Test alert management endpoints"""
        print("\n" + "="*50)
        print("TESTING ALERT SYSTEM")
        print("="*50)
        
        # Get active alerts (all users can do this)
        if self.student_token:
            self.run_test(
                "Get Active Alerts (Student)",
                "GET",
                "/alerts",
                200,
                token=self.student_token
            )
        
        # Create alert (admin only)
        if self.admin_token:
            alert_data = {
                "title": "Test Emergency Alert",
                "message": "This is a test emergency alert for system testing",
                "alert_type": "fire",
                "severity": "high"
            }
            
            success, alert = self.run_test(
                "Create Alert (Admin)",
                "POST",
                "/alerts",
                200,
                data=alert_data,
                token=self.admin_token
            )
            
            if success and alert:
                # Update alert status
                self.run_test(
                    "Update Alert Status",
                    "PUT",
                    f"/alerts/{alert['id']}",
                    200,
                    data={"active": False},
                    token=self.admin_token
                )
        
        # NEW: Test teacher can create alerts
        if self.teacher_token:
            teacher_alert_data = {
                "title": "Teacher Emergency Alert",
                "message": "This is a test alert created by teacher",
                "alert_type": "earthquake",
                "severity": "medium"
            }
            
            self.run_test(
                "Create Alert (Teacher)",
                "POST",
                "/alerts",
                200,
                data=teacher_alert_data,
                token=self.teacher_token
            )
        
        # Try to create alert as student (should fail)
        if self.student_token:
            alert_data = {
                "title": "Unauthorized Alert",
                "message": "This should fail",
                "alert_type": "general",
                "severity": "low"
            }
            
            self.run_test(
                "Create Alert (Student - Should Fail)",
                "POST",
                "/alerts",
                403,
                data=alert_data,
                token=self.student_token
            )

    def test_emergency_contacts(self):
        """Test emergency contacts endpoints"""
        print("\n" + "="*50)
        print("TESTING EMERGENCY CONTACTS")
        print("="*50)
        
        if not self.student_token:
            print("❌ Skipping emergency contacts tests - no student token")
            return
        
        # Get emergency contacts
        success, contacts = self.run_test(
            "Get Emergency Contacts",
            "GET",
            "/emergency-contacts",
            200,
            token=self.student_token
        )
        
        if success and contacts:
            print(f"Found {len(contacts)} emergency contacts")
            for contact in contacts[:3]:  # Show first 3
                print(f"  - {contact['name']}: {contact['phone']} ({contact['type']})")

    def test_disaster_prediction(self):
        """Test disaster prediction endpoints"""
        print("\n" + "="*50)
        print("TESTING DISASTER PREDICTION")
        print("="*50)
        
        if not self.student_token:
            print("❌ Skipping prediction tests - no student token")
            return
        
        # Test predictions for different cities
        test_cities = ["San Francisco", "Miami", "Oklahoma City", "New York"]
        
        for city in test_cities:
            success, prediction = self.run_test(
                f"Predict Disaster Risk for {city}",
                "POST",
                f"/predict-disaster?city={city}",
                200,
                token=self.student_token
            )
            
            if success and prediction:
                print(f"  Risk: {prediction['risk_percentage']:.1f}% - Disasters: {', '.join(prediction['disaster_types'])}")
        
        # Get all predictions
        self.run_test(
            "Get All Predictions",
            "GET",
            "/predictions",
            200,
            token=self.student_token
        )

    def test_modules_and_videos(self):
        """Test modules and video completion functionality"""
        print("\n" + "="*50)
        print("TESTING MODULES AND VIDEO COMPLETION")
        print("="*50)
        
        if not self.student_token:
            print("❌ Skipping modules tests - no student token")
            return
        
        # Get all modules
        success, modules = self.run_test(
            "Get All Modules",
            "GET",
            "/modules",
            200,
            token=self.student_token
        )
        
        if success and modules:
            print(f"Found {len(modules)} modules")
            expected_modules = ["Fire Safety", "Earthquake Response", "Flood Preparedness", "Emergency Kits"]
            expected_videos = [
                "https://youtu.be/ReL-DM9xhpI",
                "https://youtu.be/BLEPakj1YTY", 
                "https://youtu.be/43M5mZuzHF8",
                "https://youtu.be/UmiGvOha7As"
            ]
            
            for i, module in enumerate(modules):
                print(f"  Module {i+1}: {module['title']} - {module['video_duration']} min")
                print(f"    Video URL: {module['video_url']}")
                print(f"    Description: {module['description'][:50]}...")
                
                # Check if module title matches expected
                if module['title'] in expected_modules:
                    print(f"    ✅ Module title matches expected")
                else:
                    print(f"    ❌ Unexpected module title: {module['title']}")
                
                # Test video completion
                video_completion_data = {
                    "module_id": module['id'],
                    "watch_percentage": 100.0
                }
                
                success_video, _ = self.run_test(
                    f"Mark Video Complete - {module['title']}",
                    "POST",
                    "/video-completion",
                    200,
                    data=video_completion_data,
                    token=self.student_token
                )
                
                # Check video completion status
                self.run_test(
                    f"Get Video Completion Status - {module['title']}",
                    "GET",
                    f"/video-completion/{module['id']}",
                    200,
                    token=self.student_token
                )
                
                # Get quizzes for this module
                success_quiz, module_quizzes = self.run_test(
                    f"Get Quizzes for {module['title']}",
                    "GET",
                    f"/quizzes/module/{module['id']}",
                    200,
                    token=self.student_token
                )
                
                if success_quiz and module_quizzes:
                    quiz = module_quizzes[0]
                    print(f"    Quiz: {quiz['title']} with {len(quiz['questions'])} questions")
                    
                    # Verify quiz has 5 questions as mentioned in requirements
                    if len(quiz['questions']) == 5:
                        print(f"    ✅ Quiz has correct number of questions (5)")
                    else:
                        print(f"    ❌ Quiz has {len(quiz['questions'])} questions, expected 5")

    def test_quiz_management_teachers(self):
        """Test teacher quiz management endpoints"""
        print("\n" + "="*50)
        print("TESTING TEACHER QUIZ MANAGEMENT")
        print("="*50)
        
        if not self.teacher_token:
            print("❌ Skipping teacher quiz management tests - no teacher token")
            return
        
        # Test creating a quiz
        quiz_data = {
            "title": "Test Teacher Quiz",
            "module_id": None,  # Standalone quiz
            "questions": [
                {
                    "question": "What is the first step in fire safety?",
                    "options": ["Run", "Alert others", "Hide", "Take photos"],
                    "correct": 1
                },
                {
                    "question": "How often should smoke detectors be checked?",
                    "options": ["Once a year", "Every 6 months", "Monthly", "Never"],
                    "correct": 2
                }
            ]
        }
        
        success, created_quiz = self.run_test(
            "Create Quiz (Teacher)",
            "POST",
            "/teacher/quizzes",
            200,
            data=quiz_data,
            token=self.teacher_token
        )
        
        quiz_id = None
        if success and created_quiz:
            quiz_id = created_quiz.get('id')
            print(f"Created quiz with ID: {quiz_id}")
        
        # Test getting teacher's quizzes
        success, teacher_quizzes = self.run_test(
            "Get Teacher Quizzes",
            "GET",
            "/teacher/quizzes",
            200,
            token=self.teacher_token
        )
        
        if success and teacher_quizzes:
            print(f"Teacher has {len(teacher_quizzes)} quizzes")
        
        # Test updating a quiz
        if quiz_id:
            updated_quiz_data = {
                "title": "Updated Test Teacher Quiz",
                "module_id": None,
                "questions": [
                    {
                        "question": "Updated question: What is fire safety?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct": 0
                    }
                ]
            }
            
            self.run_test(
                "Update Quiz (Teacher)",
                "PUT",
                f"/teacher/quizzes/{quiz_id}",
                200,
                data=updated_quiz_data,
                token=self.teacher_token
            )
        
        # Test admin can access teacher quiz management
        if self.admin_token:
            self.run_test(
                "Get Teacher Quizzes (Admin)",
                "GET",
                "/teacher/quizzes",
                200,
                token=self.admin_token
            )
        
        # Test student cannot access teacher quiz management
        if self.student_token:
            self.run_test(
                "Get Teacher Quizzes (Student - Should Fail)",
                "GET",
                "/teacher/quizzes",
                403,
                token=self.student_token
            )
        
        # Test deleting a quiz
        if quiz_id:
            self.run_test(
                "Delete Quiz (Teacher)",
                "DELETE",
                f"/teacher/quizzes/{quiz_id}",
                200,
                token=self.teacher_token
            )

    def test_leaderboard_system(self):
        """Test student leaderboard and ranking system"""
        print("\n" + "="*50)
        print("TESTING LEADERBOARD SYSTEM")
        print("="*50)
        
        if not self.student_token:
            print("❌ Skipping leaderboard tests - no student token")
            return
        
        # Test leaderboard endpoint
        success, leaderboard_data = self.run_test(
            "Get Student Leaderboard",
            "GET",
            "/leaderboard",
            200,
            token=self.student_token
        )
        
        if success and leaderboard_data:
            leaderboard = leaderboard_data.get('leaderboard', [])
            total_students = leaderboard_data.get('total_students', 0)
            current_user_rank = leaderboard_data.get('current_user_rank')
            
            print(f"Leaderboard shows top {len(leaderboard)} students out of {total_students}")
            if current_user_rank:
                print(f"Current user rank: #{current_user_rank}")
            
            for i, student in enumerate(leaderboard[:5]):  # Show top 5
                print(f"  #{student['rank']}: {student['student_name']} - {student['overall_score']} pts")
                print(f"    Modules: {student['completed_modules']}/{student['total_modules']}, Quizzes: {student['total_quizzes']}")
                print(f"    Completion Speed: {student['completion_speed']} modules/day")
        
        # Test teacher can access leaderboard
        if self.teacher_token:
            self.run_test(
                "Get Student Leaderboard (Teacher)",
                "GET",
                "/leaderboard",
                200,
                token=self.teacher_token
            )
        
        # Test admin can access leaderboard
        if self.admin_token:
            self.run_test(
                "Get Student Leaderboard (Admin)",
                "GET",
                "/leaderboard",
                200,
                token=self.admin_token
            )

    def test_teacher_dashboard(self):
        """Test teacher dashboard functionality"""
        print("\n" + "="*50)
        print("TESTING TEACHER DASHBOARD")
        print("="*50)
        
        if not self.teacher_token:
            print("❌ Skipping teacher dashboard tests - no teacher token")
            return
        
        # Test teacher students progress endpoint with ranking
        success, progress_data = self.run_test(
            "Get Students Progress with Rankings (Teacher)",
            "GET",
            "/teacher/students-progress",
            200,
            token=self.teacher_token
        )
        
        if success and progress_data:
            students = progress_data.get('students_progress', [])
            class_stats = progress_data.get('class_statistics', {})
            
            print(f"Found {len(students)} students in class")
            print(f"Class Statistics:")
            print(f"  Total Students: {class_stats.get('total_students', 0)}")
            print(f"  Average Points: {class_stats.get('average_points', 0)}")
            print(f"  Average Modules: {class_stats.get('average_modules_completed', 0)}")
            print(f"  Average Quizzes: {class_stats.get('average_quizzes_completed', 0)}")
            print(f"  Average Overall Score: {class_stats.get('average_overall_score', 0)}")
            
            for student in students:
                print(f"  Rank #{student.get('rank', 'N/A')}: {student['student_name']} - Overall Score: {student.get('overall_score', 0)}")
                print(f"    Points: {student['total_points']}, Modules: {student['completed_modules']}/{student['total_modules']}")
                print(f"    Completion Speed: {student.get('completion_speed', 0)} modules/day")

    def test_admin_teacher_progress(self):
        """Test admin teacher progress tracking"""
        print("\n" + "="*50)
        print("TESTING ADMIN TEACHER PROGRESS")
        print("="*50)
        
        if not self.admin_token:
            print("❌ Skipping admin teacher progress tests - no admin token")
            return
        
        # Test admin teachers progress endpoint
        success, teachers_data = self.run_test(
            "Get Teachers Progress (Admin)",
            "GET",
            "/admin/teachers-progress",
            200,
            token=self.admin_token
        )
        
        if success and teachers_data:
            teachers = teachers_data.get('teachers_progress', [])
            total_teachers = teachers_data.get('total_teachers', 0)
            
            print(f"Found {len(teachers)} teachers, total: {total_teachers}")
            
            for teacher in teachers:
                print(f"  Teacher: {teacher['teacher_name']} (@{teacher['teacher_username']})")
                print(f"    Created Quizzes: {teacher['created_quizzes']}")
                print(f"    Created Alerts: {teacher['created_alerts']}")
                print(f"    Account Created: {teacher['account_created']}")
        
        # Test teacher cannot access this endpoint
        if self.teacher_token:
            self.run_test(
                "Get Teachers Progress (Teacher - Should Fail)",
                "GET",
                "/admin/teachers-progress",
                403,
                token=self.teacher_token
            )
        
        # Test student cannot access this endpoint
        if self.student_token:
            self.run_test(
                "Get Teachers Progress (Student - Should Fail)",
                "GET",
                "/admin/teachers-progress",
                403,
                token=self.student_token
            )

    def test_user_stats(self):
        """Test user statistics endpoint"""
        print("\n" + "="*50)
        print("TESTING USER STATISTICS")
        print("="*50)
        
        if not self.student_token or not self.student_user:
            print("❌ Skipping user stats tests - no student token/user")
            return
        
        success, stats = self.run_test(
            "Get Student Statistics",
            "GET",
            f"/user-stats/{self.student_user['id']}",
            200,
            token=self.student_token
        )
        
        if success and stats:
            print(f"  Total Points: {stats.get('total_points', 0)}")
            print(f"  Quizzes Completed: {stats.get('total_quizzes_completed', 0)}")
            print(f"  Drills Participated: {stats.get('total_drills_participated', 0)}")
            print(f"  Completed Modules: {stats.get('completed_modules', 0)}/{stats.get('total_modules', 0)}")
            
            # Check module progress details
            module_progress = stats.get('module_progress', [])
            if module_progress:
                print(f"  Module Progress Details:")
                for progress in module_progress:
                    video_status = "✅" if progress.get('video_completed') else "❌"
                    quiz_status = "✅" if progress.get('quiz_completed') else "❌"
                    quiz_score = f"({progress.get('quiz_score', 0)}/{progress.get('quiz_total', 0)})" if progress.get('quiz_completed') else ""
                    print(f"    {progress['module_title']}: Video {video_status}, Quiz {quiz_status} {quiz_score}")

def main():
    print("🚀 Starting Disaster Preparedness API Testing")
    print("=" * 60)
    
    tester = DisasterPreparednessAPITester()
    
    # Run all tests
    tester.test_authentication()
    tester.test_user_management()
    tester.test_modules_and_videos()
    tester.test_quiz_system()
    tester.test_quiz_management_teachers()  # NEW: Teacher quiz management
    tester.test_drill_system()
    tester.test_alert_system()  # Updated with teacher alert creation
    tester.test_emergency_contacts()
    tester.test_disaster_prediction()
    tester.test_leaderboard_system()  # NEW: Leaderboard and ranking
    tester.test_teacher_dashboard()  # Updated with ranking
    tester.test_admin_teacher_progress()  # NEW: Admin teacher progress
    tester.test_user_stats()
    
    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())