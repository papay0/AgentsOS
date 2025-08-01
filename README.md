<div align="center">
    <img src="https://raw.githubusercontent.com/papay0/agentspod/main/docs/logo.svg" alt="AgentsPod logo" width="120" height="120">
    <h1>AgentsPod</h1>
</div>

<p align="center">
    <a href="https://github.com/papay0/agentspod/stargazers"><img src="https://img.shields.io/github/stars/papay0/agentspod?style=social" alt="GitHub stars" /></a>
    <a href="https://github.com/papay0/agentspod/fork"><img src="https://img.shields.io/github/forks/papay0/agentspod?style=social" alt="GitHub forks" /></a>
    <a href="https://github.com/papay0/agentspod/blob/main/LICENSE"><img src="https://img.shields.io/github/license/papay0/agentspod" alt="License" /></a>
    <a href="https://github.com/papay0/agentspod/issues"><img src="https://img.shields.io/github/issues/papay0/agentspod" alt="GitHub issues" /></a>
</p>

<div align="center">
    <img src="https://raw.githubusercontent.com/papay0/agentspod/main/docs/screenshot.png" alt="AgentsPod Screenshot" width="800">
</div>

> Launch on-demand development workspaces with VSCode and Claude Code CLI pre-installed. Code with AI assistance from anywhere, even your phone.

## ✨ Features

- 🖥️ **VSCode in Browser** - Full-featured VS Code editor with extensions and themes
- 🤖 **Claude Code CLI** - AI-powered development assistant built into your terminal
- 📱 **Works Everywhere** - Code from any device with a browser (laptop, tablet, phone)
- ⚡ **Instant Setup** - Launch your environment in under 30 seconds
- ☁️ **Cloud Resources** - Scalable compute power without local setup constraints
- 🔒 **Isolated Environments** - Each workspace is completely sandboxed
- 🎯 **Terminal Splitting** - Multiple terminals with tabbed interface
- 🌐 **Open Source** - Free to use and contribute to

## 🚀 Quick Start

### Prerequisites

- Daytona API Key ([Get one here](https://www.daytona.io/))
- Firebase Project ([Create one here](https://console.firebase.google.com/))
- Node.js 20+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/papay0/agentspod.git
   cd agentspod
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Add your DAYTONA_API_KEY and Firebase config to .env.local
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🎯 How It Works

1. **Click "Launch Workspace"** - Start your development environment with one click
2. **Wait ~30 seconds** - We install VSCode, Claude CLI, and configure everything
3. **Start Coding** - Your complete AI-powered development environment is ready

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Daytona SDK for workspace orchestration
- **Database**: Firebase Firestore (for waitlist and analytics)
- **Analytics**: Firebase Analytics
- **Editor**: code-server (VSCode in browser)
- **Terminal**: ttyd for web-based terminal access
- **AI**: Claude Code CLI integration

## 📖 Usage

### Creating a Workspace

1. Navigate to the home page
2. Click "Launch Workspace"
3. Wait for the workspace to be created and configured
4. Access your development environment with VSCode and terminal

### Managing Workspaces

- **Start/Stop**: Control workspace states from the dashboard
- **Multiple Terminals**: Create and manage multiple terminal sessions
- **AI Assistance**: Use Claude Code CLI directly in the terminal
- **File Management**: Full file system access through VSCode

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Environment Variables

```bash
# Required
DAYTONA_API_KEY=your_daytona_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Firebase Setup

AgentsPod uses Firebase for analytics and waitlist functionality:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Analytics and Firestore
3. Go to Project Settings → General → Your apps
4. Copy your Firebase config values to `.env.local`
5. Firebase will automatically track workspace usage and user engagement

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 🙏 Acknowledgments

- [Daytona](https://www.daytona.io/) for providing the infrastructure platform
- [Claude Code](https://claude.ai/code) for the AI development assistant
- [VS Code](https://code.visualstudio.com/) for the amazing editor
- All contributors who help make this project better

---

<div align="center">
    <p>Made with ❤️ by the open source community</p>
    <p>
        <a href="https://github.com/papay0/agentspod/issues">Report Bug</a> ·
        <a href="https://github.com/papay0/agentspod/issues">Request Feature</a> ·
        <a href="https://github.com/papay0/agentspod/discussions">Discussions</a>
    </p>
</div>