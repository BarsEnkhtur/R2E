import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiUrl } from "@/lib/config";

interface Completion {
  id: number;
  taskId: string;
  taskName: string;
  timestamp: string;
  notes: string;
  pointsEarned: number;
}

interface CompletionHistoryProps {
  weekStart: string;
  weekEnd: string;
}

export default function CompletionHistory({ weekStart, weekEnd }: CompletionHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingCompletion, setEditingCompletion] = useState<Completion | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Fetch completions for the week
  const { data: completions = [], isLoading } = useQuery({
    queryKey: ['/api/completions', weekStart, weekEnd],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/completions?weekStart=${weekStart}&weekEnd=${weekEnd}`));
      if (!response.ok) throw new Error('Failed to fetch completions');
      return response.json();
    },
    enabled: !!weekStart && !!weekEnd,
  });

  // Delete completion mutation
  const deleteCompletionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(apiUrl(`/api/completions/${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete completion');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      toast({
        title: "Completion deleted",
        description: "The task completion has been removed and multipliers recalculated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete completion. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const response = await fetch(apiUrl(`/api/completions/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (!response.ok) throw new Error('Failed to update notes');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completions'] });
      setShowEditDialog(false);
      setEditingCompletion(null);
      toast({
        title: "Notes updated",
        description: "Completion notes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notes. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleEditNotes = (completion: Completion) => {
    setEditingCompletion(completion);
    setEditNotes(completion.notes || "");
    setShowEditDialog(true);
  };

  const handleSaveNotes = () => {
    if (editingCompletion) {
      updateNotesMutation.mutate({
        id: editingCompletion.id,
        notes: editNotes
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteCompletionMutation.mutate(id);
  };

  const formatDateTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, h:mm a");
    } catch {
      return timestamp;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Completion History
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="text-center py-4">Loading completions...</div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Completion History ({completions.length} entries)
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            {completions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No completions recorded for this week.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Name</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Points Earned</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completions.map((completion: Completion) => (
                    <TableRow key={completion.id}>
                      <TableCell className="font-medium">{completion.taskName}</TableCell>
                      <TableCell>{formatDateTime(completion.timestamp)}</TableCell>
                      <TableCell>{completion.pointsEarned} pts</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {completion.notes || "(blank)"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNotes(completion)}
                            title="Edit Notes"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800"
                                title="Delete Completion"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Completion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this completion? This will remove the entry and recalculate your multipliers for the week. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(completion.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        )}
      </Card>

      {/* Edit Notes Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes for {editingCompletion?.taskName}</Label>
              <Input
                id="notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add a note about this completion..."
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveNotes}
                disabled={updateNotesMutation.isPending}
                className="flex-1"
              >
                {updateNotesMutation.isPending ? "Saving..." : "Save Notes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}