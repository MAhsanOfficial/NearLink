# 🧪 NearLink - Complete Testing Checklist

## ✅ Pre-Launch Testing Guide

---

## 🔐 Authentication Tests

### Customer Signup
```
Test Case 1: Valid Customer Registration
- [ ] Navigate to /auth/signup
- [ ] Enter name, email, phone, password
- [ ] Select "Customer" user type
- [ ] Enter location (area, address, coordinates)
- [ ] Click "Sign Up"
- [ ] Verify redirect to /dashboard
- [ ] Check JWT token stored in localStorage

Test Case 2: Invalid Registration
- [ ] Try duplicate email → Should show error
- [ ] Try weak password → Should show validation error
- [ ] Leave required fields empty → Should prevent submission

