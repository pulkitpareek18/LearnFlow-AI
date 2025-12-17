# LearnFlow AI

AI-powered adaptive learning platform that transforms PDFs into interactive courses with personalized tutoring, gamification, and detailed analytics.

## Features

### For Teachers
- **PDF to Course Generation** - Upload any PDF and AI automatically generates structured courses with chapters, modules, and assessments
- **AI-Generated Content** - Automatic creation of learning outcomes, interactive exercises, and quizzes
- **Student Analytics** - Track student progress, performance, and engagement
- **Course Management** - Edit, organize, and publish courses

### For Students
- **Personalized Learning** - AI adapts content difficulty and style based on your performance
- **AI Tutor Chat** - Get instant explanations and help from Claude AI tutor
- **Interactive Assessments** - MCQs, fill-in-the-blanks, reflections, and more
- **Spaced Repetition** - Smart review system for long-term retention
- **Gamification** - Earn XP, maintain streaks, unlock badges, and level up
- **Progress Tracking** - Detailed analytics on your learning journey

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **AI**: Anthropic Claude API (claude-sonnet-4)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database (local or Atlas)
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/learnflow.git
cd learnflow
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file based on `.env.example`:
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/learnflow

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-your-api-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── student/       # Student pages
│   │   └── teacher/       # Teacher pages
│   └── api/               # API routes
├── components/            # React components
│   ├── interactive/       # Interactive learning components
│   ├── layouts/           # Layout components
│   ├── student/           # Student-specific components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
│   ├── ai/                # Anthropic AI integration
│   ├── auth/              # Authentication config
│   ├── db/                # Database models & connection
│   └── adaptive/          # Adaptive learning algorithms
├── contexts/              # React contexts
└── types/                 # TypeScript type definitions
```

## Key Features Explained

### AI Course Generation
When a teacher uploads a PDF:
1. Content is extracted and analyzed by Claude AI
2. AI generates a structured course outline with chapters
3. Each chapter gets detailed modules with interactive content
4. Assessments are automatically created for each module

### Adaptive Learning
The platform tracks student performance and:
- Adjusts content difficulty based on accuracy
- Provides personalized recommendations
- Offers simplified explanations when struggling
- Challenges high performers with harder content

### Gamification System
- **XP Points**: Earned by completing modules and assessments
- **Levels**: Progress through levels as you earn XP
- **Streaks**: Maintain daily learning streaks
- **Badges**: Unlock achievements for milestones
- **Weekly Goals**: Set and track learning targets

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `NEXTAUTH_URL` | Your app's URL |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.
