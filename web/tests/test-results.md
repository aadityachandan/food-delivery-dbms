# API test results

Run on 31/10/2026, 8:49:39 am against http://localhost:3311. **32/32 passed.**

| ID | Area | Test case | Expected | Actual | Result |
|---|---|---|---|---|---|
| TC01 | Auth | Customer logs in with the correct password | 200 + session cookie | 200 (Aarav Sharma) | PASS |
| TC02 | Auth | Login with a wrong password is refused | 401 | 401 "Wrong email or password" | PASS |
| TC03 | Auth | Not logged in: order history is refused | 401 | 401 "Please log in" | PASS |
| TC04 | Auth | Customer cannot open an admin API | 403 | 403 "Your role cannot do this" | PASS |
| TC05 | Auth | Blocked customer cannot log in | 403 | 403 "This account is blocked or suspended" | PASS |
| TC06 | Auth | New customer can sign up (password stored as bcrypt) | 200 | 200 | PASS |
| TC07 | Validation | Sign-up with an existing email is refused (UNIQUE) | 409 | 409 "This already exists" | PASS |
| TC08 | Customer | Full-text search “paneer” finds restaurants by dish | restaurants with matched dishes | 2 restaurants: Punjab Da Dhaba (Paneer Butter Masala); Dragon Wok (Chilli Paneer) | PASS |
| TC09 | Customer | Find an open restaurant for the order tests | at least one open | Udupi Upahar (#2) | PASS |
| TC10 | Customer | Bill preview uses stored functions (fee + 5% GST) | total = subtotal − discount + fee + tax | subtotal 80, fee 30, tax 4, total 114 | PASS |
| TC11 | Validation | Coupon for another restaurant is rejected (fn_coupon_check) | 400 with reason | 400 "PIZZA150 is not valid at this restaurant" | PASS |
| TC12 | Validation | Ordering to another customer’s address is refused (procedure SIGNAL) | 400 | 400 "That address does not belong to this customer" | PASS |
| TC13 | Transaction | Place a COD order with sp_place_order | 200 + order id | 200 order #26 | PASS |
| TC14 | Customer | Tracking shows MySQL data and the MongoDB timeline | status PLACED, payment PENDING, PLACED event | PLACED, payment PENDING, events: PLACED | PASS |
| TC15 | Authorization | Another restaurant’s owner cannot change this order | 403 | 403 "This order is not yours" | PASS |
| TC16 | Trigger | Skipping steps (PLACED → READY) is blocked by trg_orders_before_update | 400 | 400 "This order status change is not allowed" | PASS |
| TC17 | Owner | Owner accepts and starts preparing | 200, 200 | 200, 200 | PASS |
| TC18 | Validation | Customer cannot cancel once the kitchen accepted | 400 | 400 "You can cancel only before the restaurant accepts the order" | PASS |
| TC19 | NoSQL | Candidate partners ranked by MongoDB $geoNear distance | list with distances | Prakash Naik 2.14 km; Ganesh Jadhav 2.93 km; Manjunath Gowda 3.93 km | PASS |
| TC20 | Transaction | Assign partner with sp_assign_partner (row locks) | 200 | 200 | PASS |
| TC21 | Validation | Assigning a second partner is refused | 400 | 400 "This order already has a delivery partner" | PASS |
| TC22 | Validation | Partner cannot pick up before the order is READY | 400 | 400 "The restaurant has not marked the order ready yet (it is PREPARING)" | PASS |
| TC23 | Trigger | Pickup → delivered: trigger sets order DELIVERED, COD paid, partner free | DELIVERED / SUCCESS / AVAILABLE | DELIVERED / SUCCESS / AVAILABLE | PASS |
| TC24 | Trigger | Review refreshes the restaurant rating (trg_review_after_insert) | 200, rating recalculated | 200, rating 4.6 → 3.7 | PASS |
| TC25 | Validation | Second review of the same order is refused | 409 | 409 "You have already rated this order" | PASS |
| TC26 | Integrity | Menu: duplicate name (UNIQUE) and price 0 (CHECK) are rejected | 409, 400 | 409, 400 | PASS |
| TC27 | Integrity | Deleting an item used in past orders is refused (FK RESTRICT); a new item can be deleted | 409, 200 | 409, 200 | PASS |
| TC28 | Integrity | Deleting an address used by orders is refused (FK RESTRICT) | 409 | 409 "This record is used by other data (for example past orders), so it cannot be deleted" | PASS |
| TC29 | Integrity | Coupon with end date before start date is rejected (CHECK) | 400 | 400 "Rejected by the database: Check constraint 'chk_coupon_dates' is violated." | PASS |
| TC30 | Integrity | Deleting a coupon already used by orders is refused (FK RESTRICT) | 409 | 409 "This record is used by other data (for example past orders), so it cannot be deleted" | PASS |
| TC31 | Queries | Query lab runs all important queries without errors | 9 reports, 0 errors | 9 reports, 0 errors | PASS |
| TC32 | NoSQL | MongoDB aggregation pipelines return results | connected, 5 pipelines | connected=true, 5 pipelines | PASS |
