import requests
import sys
import json
from datetime import datetime

class DisasterPreparednessAPITester:
    def __init__(self, base_url="https://readyresponse.preview.emergentagent.com/api"):
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

def main():
    print("🚀 Starting Disaster Preparedness API Testing")
    print("=" * 60)
    
    tester = DisasterPreparednessAPITester()
    
    # Run all tests
    tester.test_authentication()
    tester.test_user_management()
    tester.test_quiz_system()
    tester.test_drill_system()
    tester.test_alert_system()
    tester.test_emergency_contacts()
    tester.test_disaster_prediction()
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