# Chat Application

A real-time chat application built with React Native (Expo) and Node.js.

## Project Structure

```
react_udemy/
├── frontend/                    # React Native Expo app
│   ├── screens/                # Screen components
│   │   └── ChatScreen.js
│   ├── components/             # Reusable components
│   │   ├── chat/              # Chat-specific components
│   │   │   ├── MessageItem.js
│   │   │   ├── MessageInput.js
│   │   │   ├── ChatHeader.js
│   │   │   └── TypingIndicator.js
│   │   └── common/            # Common components
│   │       └── UsernameInput.js
│   ├── services/              # API and service layers
│   │   └── socketService.js
│   ├── hooks/                 # Custom React hooks
│   │   ├── useSocket.js
│   │   └── useChat.js
│   ├── utils/                 # Utility functions
│   │   └── index.js
│   ├── constants/             # Constants and configuration
│   │   └── index.js
│   └── App.js                 # Main app component
│
└── backend/                    # Node.js Express server
    ├── config/                # Configuration files
    │   └── index.js
    ├── controllers/           # Route controllers
    │   └── healthController.js
    ├── services/              # Business logic
    │   ├── socketService.js
    │   └── userService.js
    ├── routes/                # API routes
    │   └── index.js
    ├── middleware/            # Custom middleware
    │   └── errorHandler.js
    ├── utils/                 # Utility functions
    └── index.js              # Server entry point
```

## Prerequisites

- Node.js (v20.19.4 or higher recommended)
- npm or yarn
- Expo CLI (installed globally or via npx)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to port 3001):
```bash
PORT=3001
CORS_ORIGIN=*
NODE_ENV=development
```

4. Start the server:
```bash
npm start
```

The backend server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Update the socket URL in `constants/index.js` if your backend is running on a different port or IP address.

4. Start the Expo development server:
```bash
npm start
```

5. Use the Expo Go app on your phone to scan the QR code, or press:
   - `a` for Android emulator
   - `i` for iOS simulator
   - `w` for web browser

## Architecture

### Backend Architecture

- **MVC Pattern**: Controllers handle routes, Services contain business logic
- **Separation of Concerns**: Socket logic separated from HTTP routes
- **Service Layer**: User management and socket handling in dedicated services
- **Middleware**: Error handling and request validation

### Frontend Architecture

- **Component-Based**: Reusable components organized by feature
- **Custom Hooks**: Socket and chat logic extracted into hooks
- **Service Layer**: Socket connection managed in a service
- **Constants**: Centralized configuration and constants
- **Utils**: Shared utility functions

## Features

- Real-time messaging using Socket.io
- User join/leave notifications
- Typing indicators
- Username-based chat
- Message timestamps
- Responsive UI
- Modular, maintainable code structure

## Configuration

### Backend Port

The backend runs on port 3001 by default. You can change this by:
1. Setting the `PORT` environment variable in `backend/.env`
2. Or modifying the default port in `backend/config/index.js`

### Frontend Socket Connection

To connect to a different backend server, update the `SOCKET_URL` constant in `frontend/constants/index.js`:

```javascript
export const SOCKET_URL = 'http://YOUR_SERVER_IP:3001';
```

For Android emulator, use `http://10.0.2.2:3001`
For iOS simulator, use `http://localhost:3001`
For physical devices, use your computer's local IP address (e.g., `http://192.168.1.100:3001`)

## Usage

1. Start the backend server first
2. Start the frontend Expo app
3. Enter a username when prompted
4. Start chatting!

## Technologies Used

### Frontend
- React Native
- Expo
- Socket.io Client
- React Hooks

### Backend
- Node.js
- Express
- Socket.io
- CORS
- dotenv

## Code Organization Benefits

- **Maintainability**: Clear separation of concerns makes code easier to maintain
- **Scalability**: Modular structure allows easy addition of new features
- **Testability**: Isolated components and services are easier to test
- **Reusability**: Components and hooks can be reused across the application
- **Readability**: Organized structure makes code easier to understand
