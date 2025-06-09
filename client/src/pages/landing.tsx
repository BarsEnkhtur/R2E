import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Share2, 
  CheckCircle, 
  Star,
  ArrowRight,
  Users,
  Calendar,
  Zap
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleDemo = () => {
    window.location.href = "/api/demo";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Road2Employment</h1>
          </div>
          <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Track Your Job Search Progress
          </Badge>
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Turn Your Job Search Into a
            <span className="text-blue-600"> Winning Game</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Track applications, networking, interview prep, and skill building. 
            Build momentum with gamification, streaks, and shareable progress reports.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            >
              Start Tracking Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleDemo}
              className="text-lg px-8 py-3"
            >
              Try Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Stay Motivated
          </h3>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Our comprehensive tracking system helps you maintain momentum throughout your job search journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CheckCircle className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Task Tracking</CardTitle>
              <CardDescription>
                Log applications, networking events, interviews, and skill-building activities with points
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Dynamic Goals</CardTitle>
              <CardDescription>
                Intelligent weekly goals that adapt based on your performance and maintain optimal challenge
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="h-10 w-10 text-yellow-600 mb-2" />
              <CardTitle>Achievement System</CardTitle>
              <CardDescription>
                Unlock badges and maintain streaks to gamify your job search and stay motivated
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Weekly Planning</CardTitle>
              <CardDescription>
                Organize your efforts by week with clear metrics and progress visualization
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Share2 className="h-10 w-10 text-indigo-600 mb-2" />
              <CardTitle>Progress Sharing</CardTitle>
              <CardDescription>
                Share your weekly achievements with mentors, accountability partners, or potential employers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Custom Tasks</CardTitle>
              <CardDescription>
                Create personalized activities that align with your specific career goals and industry
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="container mx-auto px-4 py-16 bg-white dark:bg-gray-800 rounded-lg mx-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            See It In Action
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Try the momentum tracker with sample data to see how it works
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
            <Target className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Try the Interactive Demo
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Experience the momentum tracker with realistic job search progress data
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleDemo} size="lg" className="bg-blue-600 hover:bg-blue-700">
                Launch Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button onClick={handleLogin} size="lg" variant="outline">
                Sign Up Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Join Job Seekers Who Stay Motivated
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "Finally, a way to track my job search that doesn't feel overwhelming. The gamification keeps me motivated!"
              </p>
              <p className="text-sm text-gray-500 mt-2">- Sarah K., Marketing Professional</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "The weekly goals adapt to my pace perfectly. I never feel behind or overwhelmed."
              </p>
              <p className="text-sm text-gray-500 mt-2">- Mike T., Software Developer</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "Sharing my progress with my career coach has made our sessions so much more productive."
              </p>
              <p className="text-sm text-gray-500 mt-2">- Jennifer L., Product Manager</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
          <Users className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Job Search?
          </h3>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who are turning their search into a systematic, 
            motivating process that leads to results.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
          >
            Start Your Journey Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 Road2Employment. Built to help you succeed in your career journey.</p>
        </div>
      </footer>
    </div>
  );
}