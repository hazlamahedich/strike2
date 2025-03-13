/**
 * Types related to versioning system
 */

/**
 * Represents a version of meeting notes
 */
export interface NoteVersion {
  id: string;
  meeting_id: string;
  content: string;
  version_number: number;
  created_at: string;
  created_by: string;
  attachments?: Array<{
    id: string;
    filename: string;
    path: string;
    content_type: string;
    size: number;
    url: string;
  }>;
}

/**
 * Represents the difference between two versions
 */
export interface VersionDiff {
  previous_version_id: string;
  current_version_id: string;
  added_lines: string[];
  removed_lines: string[];
  changed_lines: Array<{
    old: string;
    new: string;
  }>;
  added_attachments: string[];
  removed_attachments: string[];
}

/**
 * Represents a version history item for display
 */
export interface VersionHistoryItem {
  id: string;
  version_number: number;
  created_at: string;
  created_by: string;
  is_current: boolean;
  has_attachments: boolean;
  attachment_count: number;
} 