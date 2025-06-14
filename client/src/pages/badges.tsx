import React from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Award, Star, Sparkles, Trophy, Target } from "lucide-react";

interface AiBadge {
  id: number;
  userId: string;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  xpReward: number;
  rarity: string;
  unlockedAt: string;
}

interface BadgeStats {
  totalBadges: number;
  totalXp: number;
  rarityBreakdown: Record<string, number>;
  recentBadges: AiBadge[];
}

export default function BadgesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Fetch AI badges
  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['/api/ai-badges'],
    queryFn: async () => {
      const response = await fetch('/api/ai-badges');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  // Calculate badge statistics
  const badgeStats: BadgeStats = {
    totalBadges: badges.length,
    totalXp: badges.reduce((sum: number, badge: AiBadge) => sum + (badge.xpReward || 0), 0),
    rarityBreakdown: badges.reduce((acc: Record<string, number>, badge: AiBadge) => {
      const rarity = badge.rarity || 'common';
      acc[rarity] = (acc[rarity] || 0) + 1;
      return acc;
    }, {}),
    recentBadges: badges
      .sort((a: AiBadge, b: AiBadge) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
      .slice(0, 3)
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'epic': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'rare': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'uncommon': return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return <Trophy className="w-4 h-4" />;
      case 'epic': return <Sparkles className="w-4 h-4" />;
      case 'rare': return <Star className="w-4 h-4" />;
      case 'uncommon': return <Target className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isAuthLoading || badgesLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading badges...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Badges</h1>
          <p className="text-gray-600">View your achievements and milestones</p>
        </div>

        {/* Badge Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Badges</p>
                  <p className="text-2xl font-bold text-gray-900">{badgeStats.totalBadges}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total XP</p>
                  <p className="text-2xl font-bold text-gray-900">{badgeStats.totalXp}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Legendary</p>
                  <p className="text-2xl font-bold text-gray-900">{badgeStats.rarityBreakdown.legendary || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Star className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recent Badges</p>
                  <p className="text-2xl font-bold text-gray-900">{badgeStats.recentBadges.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Badges */}
        {badgeStats.recentBadges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {badgeStats.recentBadges.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl">{badge.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                        <Badge className={`text-xs ${getRarityColor(badge.rarity)}`}>
                          {getRarityIcon(badge.rarity)}
                          <span className="ml-1">{badge.rarity}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>+{badge.xpReward} XP</span>
                        <span>Unlocked {formatDate(badge.unlockedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Badges */}
        {badges.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Badges ({badges.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge: AiBadge) => (
                  <div key={badge.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{badge.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">{badge.name}</h3>
                          <Badge className={`text-xs ${getRarityColor(badge.rarity)}`}>
                            {getRarityIcon(badge.rarity)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{badge.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>+{badge.xpReward} XP</span>
                          <span>{formatDate(badge.unlockedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Badges Yet</h3>
                <p className="text-gray-500 mb-4">
                  Start completing tasks to unlock your first achievements! Badges are automatically awarded based on your activity patterns and milestones.
                </p>
                <div className="text-sm text-gray-600">
                  <p>Complete tasks consistently to unlock badges like:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Consistency streaks</li>
                    <li>• Task completion milestones</li>
                    <li>• Weekly goal achievements</li>
                    <li>• Special activity patterns</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rarity Legend */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Badge Rarity System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-800">
                  <Award className="w-3 h-3 mr-1" />
                  Common
                </Badge>
                <span className="text-sm text-blue-800">Basic achievements</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-green-400 to-green-600 text-white">
                  <Target className="w-3 h-3 mr-1" />
                  Uncommon
                </Badge>
                <span className="text-sm text-blue-800">Regular milestones</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Rare
                </Badge>
                <span className="text-sm text-blue-800">Significant progress</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Trophy className="w-3 h-3 mr-1" />
                  Legendary
                </Badge>
                <span className="text-sm text-blue-800">Exceptional feats</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}