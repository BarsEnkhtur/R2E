import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Award, Star, Sparkles, Trophy, Target, Lock, Filter, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/config";

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
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [showLocked, setShowLocked] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI badges - authentic data only
  const { data: badgesData = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['/api/ai-badges'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/ai-badges'));
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  // Generate AI badge mutation
  const generateBadgeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(apiUrl('/api/generate-ai-badge'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate badge');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-badges'] });
      if (data.badge) {
        toast({
          title: "New Badge Earned!",
          description: `You've unlocked "${data.badge.name}" - ${data.badge.description}`,
        });
      } else if (data.message) {
        toast({
          title: "Badge Generation",
          description: data.message,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter only unlocked badges for statistics
  const unlockedBadges = badgesData.filter((badge: AiBadge) => badge.unlockedAt);

  // Calculate badge statistics from authentic data
  const badgeStats: BadgeStats = {
    totalBadges: unlockedBadges.length,
    totalXp: unlockedBadges.reduce((sum: number, badge: AiBadge) => sum + (badge.xpReward || 0), 0),
    rarityBreakdown: unlockedBadges.reduce((acc: Record<string, number>, badge: AiBadge) => {
      const rarity = badge.rarity || 'common';
      acc[rarity] = (acc[rarity] || 0) + 1;
      return acc;
    }, {}),
    recentBadges: unlockedBadges
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

  // Filter badges based on rarity and locked status
  const filteredBadges = badgesData.filter((badge: AiBadge) => {
    const rarityMatch = filterRarity === 'all' || badge.rarity === filterRarity;
    const lockMatch = showLocked || badge.unlockedAt;
    return rarityMatch && lockMatch;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Filter Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Badges</h1>
            <p className="text-gray-600">Track your achievements and milestones</p>
          </div>
          
          {/* Filter Controls */}
          {badgesData.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-white"
              >
                <option value="all">All Rarities</option>
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
          )}
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

        {/* Badge Gallery */}
        {badgesData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Badge Gallery ({filteredBadges.length}{filterRarity !== 'all' ? ` ${filterRarity}` : ''})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredBadges.map((badge: AiBadge) => (
                  <Card key={badge.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      {/* Badge Icon */}
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                        <div className="text-2xl">{badge.icon}</div>
                      </div>
                      
                      {/* Badge Title */}
                      <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>
                      
                      {/* Rarity Badge */}
                      <Badge className={`mb-2 text-xs ${getRarityColor(badge.rarity)}`}>
                        {getRarityIcon(badge.rarity)}
                        <span className="ml-1">{badge.rarity}</span>
                      </Badge>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{badge.description}</p>
                      
                      {/* XP */}
                      <div className="text-xs text-gray-500 mb-2">+{badge.xpReward} XP</div>
                      
                      {/* Unlock Date */}
                      <div className="text-xs text-green-600">
                        Unlocked {formatDate(badge.unlockedAt)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredBadges.length === 0 && badgesData.length > 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <Filter className="w-8 h-8 mx-auto" />
                  </div>
                  <p className="text-gray-600">No badges match the current filter</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFilterRarity('all')}
                    className="mt-2"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Badges Yet</h3>
                <p className="text-gray-500 mb-6">Start completing tasks to unlock your first achievements!</p>
                
                {/* Generate Badge Button */}
                <Button
                  onClick={() => generateBadgeMutation.mutate()}
                  disabled={generateBadgeMutation.isPending}
                  className="mb-6"
                >
                  {generateBadgeMutation.isPending ? (
                    "Analyzing Your Progress..."
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Your First Badge
                    </>
                  )}
                </Button>
                
                <div className="text-left max-w-md mx-auto space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Example badge types:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
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