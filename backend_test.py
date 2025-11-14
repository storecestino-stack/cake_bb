#!/usr/bin/env python3
"""
Comprehensive backend API testing for Confectionary CRM system
Tests all CRUD operations for authentication, clients, ingredients, recipes, and orders
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class ConfectionaryCRMTester:
    def __init__(self, base_url="https://confectionary-crm.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_entities = {
            'clients': [],
            'ingredients': [],
            'recipes': [],
            'orders': []
        }

    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                try:
                    error_detail = response.json()
                    self.log(f"   Error details: {error_detail}", "ERROR")
                except:
                    self.log(f"   Response text: {response.text[:200]}", "ERROR")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Exception: {str(e)}", "FAIL")
            return False, {}

    def test_auth_signup(self):
        """Test user registration"""
        test_user_data = {
            "name": "Тестовий Кондитер",
            "email": "test2@example.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/signup",
            200,
            test_user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log(f"✅ Registration successful, token obtained")
            return True
        return False

    def test_auth_login(self):
        """Test user login"""
        login_data = {
            "email": "test2@example.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log(f"✅ Login successful, token obtained")
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_clients_crud(self):
        """Test client CRUD operations"""
        # Create client
        client_data = {
            "name": "Тестовий Клієнт",
            "email": "client@test.com",
            "phone": "+380123456789"
        }
        
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            200,
            client_data
        )
        
        if not success:
            return False
            
        client_id = response.get('id')
        if client_id:
            self.created_entities['clients'].append(client_id)
        
        # Get all clients
        success, clients = self.run_test(
            "Get All Clients",
            "GET",
            "clients",
            200
        )
        
        if not success:
            return False
            
        # Update client
        if client_id:
            update_data = {
                "name": "Оновлений Клієнт",
                "email": "updated@test.com",
                "phone": "+380987654321"
            }
            
            success, _ = self.run_test(
                "Update Client",
                "PUT",
                f"clients/{client_id}",
                200,
                update_data
            )
            
            if not success:
                return False
        
        return True

    def test_ingredients_crud(self):
        """Test ingredient CRUD operations"""
        # Create ingredient
        ingredient_data = {
            "name": "Борошно",
            "unit": "кг",
            "price": 25.50
        }
        
        success, response = self.run_test(
            "Create Ingredient",
            "POST",
            "ingredients",
            200,
            ingredient_data
        )
        
        if not success:
            return False
            
        ingredient_id = response.get('id')
        if ingredient_id:
            self.created_entities['ingredients'].append(ingredient_id)
        
        # Create second ingredient for recipe testing
        ingredient_data2 = {
            "name": "Цукор",
            "unit": "кг",
            "price": 30.00
        }
        
        success, response2 = self.run_test(
            "Create Second Ingredient",
            "POST",
            "ingredients",
            200,
            ingredient_data2
        )
        
        if success and response2.get('id'):
            self.created_entities['ingredients'].append(response2['id'])
        
        # Get all ingredients
        success, ingredients = self.run_test(
            "Get All Ingredients",
            "GET",
            "ingredients",
            200
        )
        
        if not success:
            return False
            
        # Update ingredient
        if ingredient_id:
            update_data = {
                "name": "Борошно вищого сорту",
                "unit": "кг",
                "price": 28.00
            }
            
            success, _ = self.run_test(
                "Update Ingredient",
                "PUT",
                f"ingredients/{ingredient_id}",
                200,
                update_data
            )
            
            if not success:
                return False
        
        return True

    def test_recipes_crud(self):
        """Test recipe CRUD operations"""
        if len(self.created_entities['ingredients']) < 2:
            self.log("❌ Not enough ingredients for recipe testing", "ERROR")
            return False
            
        # Create recipe
        recipe_data = {
            "name": "Тестовий Торт",
            "description": "Простий торт для тестування",
            "laborCost": 50.00,
            "markup": 20.0,
            "ingredients": [
                {
                    "ingredientId": self.created_entities['ingredients'][0],
                    "quantity": 1.0
                },
                {
                    "ingredientId": self.created_entities['ingredients'][1],
                    "quantity": 0.5
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Recipe",
            "POST",
            "recipes",
            200,
            recipe_data
        )
        
        if not success:
            return False
            
        recipe_id = response.get('id')
        if recipe_id:
            self.created_entities['recipes'].append(recipe_id)
        
        # Get all recipes
        success, recipes = self.run_test(
            "Get All Recipes",
            "GET",
            "recipes",
            200
        )
        
        if not success:
            return False
            
        # Test recipe cost calculation
        if recipe_id:
            success, cost_data = self.run_test(
                "Calculate Recipe Cost",
                "GET",
                f"recipes/{recipe_id}/calculate",
                200
            )
            
            if success:
                self.log(f"✅ Recipe cost calculation: {cost_data}")
            else:
                return False
        
        return True

    def test_orders_crud(self):
        """Test order CRUD operations"""
        if not self.created_entities['clients']:
            self.log("❌ No clients available for order testing", "ERROR")
            return False
            
        # Create order
        due_date = (datetime.now() + timedelta(days=3)).isoformat()
        order_data = {
            "clientId": self.created_entities['clients'][0],
            "item": "Тестовий Торт",
            "dueDate": due_date,
            "total": 150.00,
            "notes": "Тестове замовлення"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            order_data
        )
        
        if not success:
            return False
            
        order_id = response.get('id')
        if order_id:
            self.created_entities['orders'].append(order_id)
        
        # Get all orders
        success, orders = self.run_test(
            "Get All Orders",
            "GET",
            "orders",
            200
        )
        
        if not success:
            return False
            
        # Update order status
        if order_id:
            update_data = {
                "status": "In Progress"
            }
            
            success, _ = self.run_test(
                "Update Order Status",
                "PUT",
                f"orders/{order_id}",
                200,
                update_data
            )
            
            if not success:
                return False
        
        return True

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, stats = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "stats/dashboard?period=month",
            200
        )
        
        if success:
            self.log(f"✅ Dashboard stats: {json.dumps(stats, indent=2)}")
        
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting Confectionary CRM API Tests")
        
        # Authentication tests
        self.log("\n📝 Testing Authentication...")
        if not self.test_auth_signup():
            # Try login if signup fails (user might already exist)
            if not self.test_auth_login():
                self.log("❌ Authentication failed, stopping tests", "ERROR")
                return False
        
        if not self.test_auth_me():
            self.log("❌ Get current user failed", "ERROR")
            return False
        
        # CRUD tests
        self.log("\n👥 Testing Clients CRUD...")
        if not self.test_clients_crud():
            self.log("❌ Clients CRUD tests failed", "ERROR")
            return False
        
        self.log("\n🥄 Testing Ingredients CRUD...")
        if not self.test_ingredients_crud():
            self.log("❌ Ingredients CRUD tests failed", "ERROR")
            return False
        
        self.log("\n📋 Testing Recipes CRUD...")
        if not self.test_recipes_crud():
            self.log("❌ Recipes CRUD tests failed", "ERROR")
            return False
        
        self.log("\n📦 Testing Orders CRUD...")
        if not self.test_orders_crud():
            self.log("❌ Orders CRUD tests failed", "ERROR")
            return False
        
        self.log("\n📊 Testing Dashboard Stats...")
        if not self.test_dashboard_stats():
            self.log("❌ Dashboard stats test failed", "ERROR")
            return False
        
        return True

    def print_summary(self):
        """Print test summary"""
        self.log(f"\n📊 Test Summary:")
        self.log(f"   Total tests: {self.tests_run}")
        self.log(f"   Passed: {self.tests_passed}")
        self.log(f"   Failed: {self.tests_run - self.tests_passed}")
        self.log(f"   Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.created_entities:
            self.log(f"\n📝 Created entities:")
            for entity_type, ids in self.created_entities.items():
                if ids:
                    self.log(f"   {entity_type}: {len(ids)} items")

def main():
    """Main test execution"""
    tester = ConfectionaryCRMTester()
    
    try:
        success = tester.run_all_tests()
        tester.print_summary()
        
        if success and tester.tests_passed == tester.tests_run:
            tester.log("🎉 All tests passed successfully!", "SUCCESS")
            return 0
        else:
            tester.log("❌ Some tests failed", "ERROR")
            return 1
            
    except KeyboardInterrupt:
        tester.log("Tests interrupted by user", "INFO")
        return 1
    except Exception as e:
        tester.log(f"Unexpected error: {str(e)}", "ERROR")
        return 1

if __name__ == "__main__":
    sys.exit(main())