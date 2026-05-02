# Waitlist Endpoint Guide

## Overview

The Waitlist endpoint allows users to join your product's waitlist. When a new signup occurs, a notification email is automatically sent to your designated contact email.

## Endpoints

### 1. Join Waitlist (Public)

**Endpoint:** `POST /api/waitlist/join`

**Authentication:** Not required

**Description:** Add an email to the waitlist with optional source tracking.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "source": "landing_page"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address to add to waitlist |
| source | string | No | Source of signup (landing_page, twitter, email, etc.) - default: 'unknown' |

**Success Response (201):**
```json
{
  "success": true,
  "message": "You have successfully joined the waitlist",
  "message_detail": "Updates will be shared via the email you provided",
  "waitlist_id": 1,
  "email": "user@example.com",
  "joined_at": "2026-05-02T12:31:22.522Z"
}
```

**Error Responses:**

Missing email (400):
```json
{
  "success": false,
  "message": "Email is required"
}
```

Invalid email (400):
```json
{
  "success": false,
  "message": "Please provide a valid email address"
}
```

Already on waitlist (400):
```json
{
  "success": false,
  "message": "You are already on the waitlist with this email"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/waitlist/join \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "source": "landing_page"
  }'
```

---

### 2. Get Waitlist Count (Public)

**Endpoint:** `GET /api/waitlist/count`

**Authentication:** Not required

**Description:** Get the total number of pending waitlist signups.

**Success Response (200):**
```json
{
  "success": true,
  "count": 42,
  "message": "42 people are on the waitlist"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/waitlist/count
```

---

### 3. Check Waitlist Status (Public)

**Endpoint:** `POST /api/waitlist/check`

**Authentication:** Not required

**Description:** Check if an email is on the waitlist and get its status.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200) - On Waitlist:**
```json
{
  "success": true,
  "on_waitlist": true,
  "status": "pending",
  "joined_at": "2026-05-02 12:31:22",
  "message": "Email is on waitlist with status: pending"
}
```

**Success Response (200) - Not on Waitlist:**
```json
{
  "success": true,
  "on_waitlist": false,
  "message": "Email not found on waitlist"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/waitlist/check \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

### 4. Remove from Waitlist (Testing/Admin)

**Endpoint:** `DELETE /api/waitlist/remove`

**Authentication:** Not required (should be protected in production)

**Description:** Remove an email from the waitlist (for testing purposes).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email removed from waitlist"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/waitlist/remove \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

## Waitlist Notifications

### How It Works

When someone joins the waitlist:
1. Email is added to the database
2. Notification email is sent to `WAITLIST_NOTIFICATION_EMAIL` (async)
3. User receives success response immediately

### Setup Instructions

**Configure in your `.env` file:**
```env
# SendGrid configuration (required)
SENDGRID_API_KEY=SG.your_key
SENDGRID_FROM_EMAIL=noreply@dotvests.com

# Waitlist notification email
WAITLIST_NOTIFICATION_EMAIL=info@dotvests.com
```

### What You Receive

**Email Subject:** `New Waitlist Signup: user@example.com`

**Email Body:**
```
New Waitlist Signup

Email: user@example.com
Source: landing_page
Joined: 2026-05-02T12:31:22.522Z

Waitlist ID: 1
```

### Multiple Notifications

To send notifications to multiple emails, modify the helper function in `routes/waitlist.js`:

```javascript
// Send to multiple emails
const notificationEmails = ['info@dotvests.com', 'contact@dotvests.com'];
for (const email of notificationEmails) {
  await sgMail.send({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@dotvests.com',
    subject: `New Waitlist Signup: ${waitlistData.email}`,
    html: emailTemplate
  });
}
```

---

## Frontend Integration Examples

### React Component Example

```javascript
import React, { useState } from 'react';

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/waitlist/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          source: 'landing_page'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setEmail('');
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to join waitlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="alert alert-success">
        Thank you for joining! Updates will be sent to your email.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Joining...' : 'Join Waitlist'}
      </button>
    </form>
  );
}

export default WaitlistForm;
```

### React Native Example

```javascript
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet
} from 'react-native';

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/waitlist/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          source: 'mobile_app'
        })
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success',
          'Thank you for joining! Updates will be sent to your email.'
        );
        setEmail('');
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join waitlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Joining...' : 'Join Waitlist'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WaitlistForm;
```

---

## Database Schema

The waitlist data is stored in the `waitlist` table:

```sql
CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending',
  source TEXT DEFAULT 'unknown'
);
```

---

## Best Practices

1. **Track Source:** Include a source parameter to track where signups come from
2. **Email Validation:** Validate emails on the frontend before submission
3. **Duplicate Prevention:** The system prevents duplicate emails automatically
4. **Notification Reliability:** Email delivery is not guaranteed - consider implementing a dashboard to view waitlist
5. **Email Configuration:** Ensure SendGrid is properly configured
6. **Export Data:** Regularly export waitlist data for marketing/communication tools

---

## Troubleshooting

### Issue: Not receiving notifications

**Check:**
- `WAITLIST_NOTIFICATION_EMAIL` is set in `.env`
- `SENDGRID_API_KEY` is valid
- Check SendGrid dashboard for delivery failures
- Check spam/junk folder

### Issue: Email already exists error

**Why:** SQLite UNIQUE constraint prevents duplicate emails
**Solution:** Use the `/check` endpoint first to validate, or allow users to update their source

### Issue: Blank or test notifications

**Why:** Email configuration might be missing
**Solution:** Notifications fail silently - check logs with: `npm start 2>&1 | grep "notification"`
