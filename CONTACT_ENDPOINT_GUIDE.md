# Contact/Feedback Endpoint Guide

## Overview

The Contact endpoint allows users to submit contact form messages and enables admins to view and manage these submissions. This endpoint is ideal for your contact section form.

## Endpoints

### 1. Submit Contact Message (Public)

**Endpoint:** `POST /api/contact/submit`

**Authentication:** Not required

**Description:** Submit a contact form message with user details and inquiry subject.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "subject": "Product Inquiry",
  "message": "I have a question about your investment platform..."
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| full_name | string | Yes | Full name of the person submitting the form |
| email | string | Yes | Valid email address for contact response |
| subject | string | Yes | Subject or topic of the inquiry |
| message | string | Yes | Detailed message or inquiry text |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Thank you for reaching out. We have received your message and will get back to you shortly",
  "contact_id": 1,
  "email": "john@example.com",
  "submitted_at": "2026-05-02T12:31:22.522Z"
}
```

**Error Responses:**

Missing full_name (400):
```json
{
  "success": false,
  "message": "Full name is required"
}
```

Invalid email (400):
```json
{
  "success": false,
  "message": "Please provide a valid email address"
}
```

Server error (500):
```json
{
  "success": false,
  "message": "Could not submit contact message",
  "error": "Error details here"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    "subject": "Feature Request",
    "message": "I would like to request a feature for portfolio analysis"
  }'
```

**Frontend Example (React):**
```javascript
async function submitContactForm(formData) {
  try {
    const response = await fetch('http://localhost:3000/api/contact/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    if (data.success) {
      alert('Thank you for reaching out!');
      // Reset form
      return true;
    } else {
      alert(data.message);
      return false;
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('Failed to submit form. Please try again.');
  }
}

// Usage
const formData = {
  full_name: "John Doe",
  email: "john@example.com",
  subject: "Product Inquiry",
  message: "I have a question about your investment platform..."
};

submitContactForm(formData);
```

---

### 2. Get Contact Messages (Admin)

**Endpoint:** `GET /api/contact/messages`

**Authentication:** Not required (should be protected by authentication in production)

**Description:** Retrieve all contact form submissions with optional filtering and pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | 'all' | Filter by status: 'all', 'unread', 'read' |
| limit | integer | 50 | Number of results per page |
| offset | integer | 0 | Number of results to skip |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "subject": "Feature Request",
      "status": "unread",
      "submitted_at": "2026-05-02 12:31:22"
    },
    {
      "id": 2,
      "full_name": "John Doe",
      "email": "john@example.com",
      "subject": "Product Inquiry",
      "status": "read",
      "submitted_at": "2026-05-02 12:32:10"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 2,
    "pages": 1
  }
}
```

**cURL Example:**
```bash
# Get all messages
curl -X GET "http://localhost:3000/api/contact/messages?status=all&limit=10&offset=0"

# Get only unread messages
curl -X GET "http://localhost:3000/api/contact/messages?status=unread&limit=10&offset=0"

# Get only read messages
curl -X GET "http://localhost:3000/api/contact/messages?status=read&limit=50&offset=0"
```

---

### 3. Mark Message as Read (Admin)

**Endpoint:** `PATCH /api/contact/messages/:id/read`

**Authentication:** Not required (should be protected by authentication in production)

**Description:** Mark a contact message as read.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Contact message ID |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact message marked as read"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Contact message not found"
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:3000/api/contact/messages/1/read \
  -H "Content-Type: application/json"
```

---

### 4. Delete Contact Message (Admin)

**Endpoint:** `DELETE /api/contact/messages/:id`

**Authentication:** Not required (should be protected by authentication in production)

**Description:** Delete a contact form submission.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Contact message ID |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact message deleted"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/contact/messages/1
```

---

## Frontend Integration Examples

### React Component Example

```javascript
import React, { useState } from 'react';

function ContactForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setFormData({
          full_name: '',
          email: '',
          subject: '',
          message: ''
        });
        // Reset success message after 5 seconds
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="alert alert-success">
        Thank you for reaching out! We'll get back to you shortly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="full_name">Full Name</label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="subject">Subject</label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows="5"
          required
        ></textarea>
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Send Message'}
      </button>
    </form>
  );
}

export default ContactForm;
```

### React Native Example

```javascript
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native';

function ContactForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email || !formData.subject || !formData.message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success',
          'Thank you for reaching out! We\'ll get back to you shortly.'
        );
        setFormData({
          full_name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.full_name}
        onChangeText={(text) => setFormData({ ...formData, full_name: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Subject"
        value={formData.subject}
        onChangeText={(text) => setFormData({ ...formData, subject: text })}
      />

      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Message"
        multiline
        numberOfLines={5}
        value={formData.message}
        onChangeText={(text) => setFormData({ ...formData, message: text })}
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Message</Text>
        )}
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
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
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

export default ContactForm;
```

---

## Database Schema

The contact messages are stored in the `contact_messages` table:

```sql
CREATE TABLE contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Admin Notifications

When a new contact message is submitted, the system automatically sends an email notification to all configured admin emails.

### Setup Instructions

1. **Configure Admin Emails** in your `.env` file:
```env
# Comma-separated list of admin emails
ADMIN_EMAILS=admin@dotvests.com,support@dotvests.com
ADMIN_DASHBOARD_URL=http://localhost:3000/admin
```

2. **Required Environment Variables:**
   - `SENDGRID_API_KEY` - Your SendGrid API key
   - `SENDGRID_FROM_EMAIL` - The email address messages are sent from
   - `ADMIN_EMAILS` - Comma-separated list of admin email addresses

3. **Email Notification Features:**
   - Automatically triggered when a contact form is submitted
   - Includes sender name, email, subject, and full message
   - Links to admin dashboard for quick access
   - Doesn't block the user's request (asynchronous)

### Email Notification Example

**Admin receives:**
```
Subject: New Contact: Product Inquiry

From: Jane Smith
Email: jane@example.com

Message:
I would like to request a feature for portfolio analysis...

View in Dashboard: http://localhost:3000/admin/contact
```

---

## Best Practices

1. **Client-side Validation:** Validate form fields before submission
2. **Rate Limiting:** Consider implementing rate limiting to prevent spam
3. **Email Notifications:** ✅ Already configured - admins receive notifications automatically
4. **Admin Dashboard:** Create an admin dashboard to manage and respond to contact submissions
5. **Response Tracking:** Track which messages have been responded to using the status field
6. **Data Privacy:** Ensure compliance with GDPR and other data protection regulations
7. **Multiple Admin Emails:** Configure multiple email addresses to ensure someone sees every message

---

## How Admin Notifications Work

### Notification Flow

```
User submits contact form
    ↓
Message saved to database
    ↓
Admin notification email triggered (async)
    ↓
Email sent to all ADMIN_EMAILS
    ↓
User receives success response (doesn't wait for email)
```

### What Happens If Configuration is Missing

- If `ADMIN_EMAILS` is not set → Notifications silently skip (no errors, no notifications sent)
- If `SENDGRID_API_KEY` is not set → Email sending fails gracefully without affecting user request
- If `SENDGRID_FROM_EMAIL` is not set → Uses default: `noreply@dotvests.com`

This ensures form submissions always succeed even if email notifications fail.

### Monitoring Email Delivery

To verify emails are being sent:

1. Check SendGrid Dashboard: https://app.sendgrid.com/statistics
2. Monitor admin email inbox for new messages
3. Enable logging in production to track failed email attempts
4. Consider setting up email delivery webhooks in SendGrid

---

## Future Enhancements

- Auto-reply with confirmation email to users
- Category/type field for better organization
- Admin response tracking and reply history
- Attachment support for additional documents
- Admin authentication requirement
- Message search functionality
- Webhook integration for external services
- SMS alerts for critical inquiries
- Automatic ticket/case management integration
