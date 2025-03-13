/**
 * Component for displaying version history of meeting notes
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Clock, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NoteVersion, VersionDiff } from '@/lib/types/version';
import { getNoteVersions, getNoteVersion, compareVersions } from '@/lib/services/versionService';
import { toast } from '@/components/ui/use-toast';

interface VersionHistoryProps {
  meetingId: string;
  currentVersionId?: string;
  onSelectVersion?: (version: NoteVersion) => void;
}

export function VersionHistory({ 
  meetingId, 
  currentVersionId,
  onSelectVersion 
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const [comparisonVersion, setComparisonVersion] = useState<NoteVersion | null>(null);
  const [versionDiff, setVersionDiff] = useState<VersionDiff | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch versions on component mount
  useEffect(() => {
    async function fetchVersions() {
      try {
        setLoading(true);
        const versionData = await getNoteVersions(meetingId);
        setVersions(versionData);
        
        // If there's a current version ID, select that version
        if (currentVersionId) {
          const currentVersion = versionData.find(v => v.id === currentVersionId);
          if (currentVersion) {
            setSelectedVersion(currentVersion);
          }
        } else if (versionData.length > 0) {
          // Otherwise select the latest version
          setSelectedVersion(versionData[0]);
        }
      } catch (error) {
        console.error('Error fetching versions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load version history',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchVersions();
  }, [meetingId, currentVersionId]);

  // Handle version selection
  const handleSelectVersion = async (version: NoteVersion) => {
    setSelectedVersion(version);
    
    // If in comparison mode, update the diff
    if (showComparison && comparisonVersion) {
      try {
        const diff = compareVersions(comparisonVersion, version);
        setVersionDiff(diff);
      } catch (error) {
        console.error('Error comparing versions:', error);
        toast({
          title: 'Error',
          description: 'Failed to compare versions',
          variant: 'destructive',
        });
      }
    }
    
    // Notify parent component if callback provided
    if (onSelectVersion) {
      onSelectVersion(version);
    }
  };

  // Start comparison mode
  const handleStartComparison = () => {
    if (!selectedVersion) return;
    
    setComparisonVersion(selectedVersion);
    setShowComparison(true);
  };

  // Cancel comparison mode
  const handleCancelComparison = () => {
    setShowComparison(false);
    setComparisonVersion(null);
    setVersionDiff(null);
  };

  // Restore the selected version
  const handleRestoreVersion = () => {
    if (!selectedVersion) return;
    
    // Notify parent component
    if (onSelectVersion) {
      onSelectVersion(selectedVersion);
    }
    
    toast({
      title: 'Version Restored',
      description: `Restored to version ${selectedVersion.version_number}`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>No versions found for this meeting</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Version History</h3>
        <div className="space-x-2">
          {showComparison ? (
            <Button variant="outline" onClick={handleCancelComparison}>
              Cancel Comparison
            </Button>
          ) : (
            <Button variant="outline" onClick={handleStartComparison}>
              Compare Versions
            </Button>
          )}
          {selectedVersion && selectedVersion.id !== currentVersionId && (
            <Button onClick={handleRestoreVersion}>
              Restore This Version
            </Button>
          )}
        </div>
      </div>
      
      {/* Version list */}
      <div className="space-y-3">
        {versions.map((version) => (
          <Card 
            key={version.id} 
            className={`cursor-pointer transition-colors ${
              selectedVersion?.id === version.id 
                ? 'border-primary' 
                : 'hover:border-muted-foreground'
            }`}
            onClick={() => handleSelectVersion(version)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Badge variant={version.id === currentVersionId ? "default" : "outline"}>
                    Version {version.version_number}
                  </Badge>
                  {version.id === currentVersionId && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                  {version.attachments && version.attachments.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      {version.attachments.length}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                </div>
              </div>
              
              {showComparison && comparisonVersion && versionDiff && (
                <div className="mt-3 pt-3 border-t text-sm">
                  <div className="flex space-x-2">
                    <div className="flex items-center">
                      <ArrowRight className="h-4 w-4 text-green-500 mr-1" />
                      <span>{versionDiff.added_lines.length} lines added</span>
                    </div>
                    <div className="flex items-center">
                      <ArrowLeft className="h-4 w-4 text-red-500 mr-1" />
                      <span>{versionDiff.removed_lines.length} lines removed</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-blue-500 mr-1" />
                      <span>{versionDiff.changed_lines.length} lines changed</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 