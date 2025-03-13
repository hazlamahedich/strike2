/**
 * Service for managing note versions
 */
import { v4 as uuidv4 } from 'uuid';
import supabase from '@/lib/supabase/client';
import { NoteVersion, VersionDiff } from '@/lib/types/version';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

/**
 * Create a new version of meeting notes
 */
export async function createNoteVersion(
  meetingId: string,
  content: string,
  attachments?: Array<any>,
  userId?: string
): Promise<NoteVersion> {
  try {
    // Check if we should use mock data
    const useMockData = getMockDataStatus();
    
    if (useMockData) {
      // Mock implementation
      console.log('Creating mock note version for meeting:', meetingId);
      
      // Generate a mock version
      const versionId = uuidv4();
      const mockVersion: NoteVersion = {
        id: versionId,
        meeting_id: meetingId,
        content: content,
        version_number: Math.floor(Math.random() * 10) + 1, // Random version number
        created_at: new Date().toISOString(),
        created_by: userId || 'system',
        attachments: attachments || []
      };
      
      console.log('Created mock version:', mockVersion);
      return mockVersion;
    }
    
    // Real implementation with Supabase
    console.log('Creating note version for meeting:', meetingId);
    
    // Get the latest version number
    const { data: versions, error: fetchError } = await supabase
      .from('note_versions')
      .select('version_number')
      .eq('meeting_id', meetingId)
      .order('version_number', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching versions:', fetchError);
      throw new Error(`Failed to fetch versions: ${fetchError.message}`);
    }
    
    // Calculate the next version number
    const nextVersionNumber = versions && versions.length > 0 
      ? versions[0].version_number + 1 
      : 1;
    
    // Create a new version record
    const versionId = uuidv4();
    const newVersion = {
      id: versionId,
      meeting_id: meetingId,
      content: content,
      version_number: nextVersionNumber,
      created_at: new Date().toISOString(),
      created_by: userId || 'system',
      attachments: attachments || []
    };
    
    // Store the version in the database
    const { error: insertError } = await supabase
      .from('note_versions')
      .insert(newVersion);
    
    if (insertError) {
      console.error('Error creating version:', insertError);
      throw new Error(`Failed to create version: ${insertError.message}`);
    }
    
    console.log('Created version:', newVersion);
    return newVersion as NoteVersion;
  } catch (error) {
    console.error('Error in createNoteVersion:', error);
    throw error;
  }
}

/**
 * Get all versions of notes for a meeting
 */
export async function getNoteVersions(meetingId: string): Promise<NoteVersion[]> {
  try {
    // Check if we should use mock data
    const useMockData = getMockDataStatus();
    
    if (useMockData) {
      // Mock implementation
      console.log('Getting mock note versions for meeting:', meetingId);
      
      // Generate mock versions
      const mockVersions: NoteVersion[] = Array.from({ length: 5 }, (_, i) => ({
        id: uuidv4(),
        meeting_id: meetingId,
        content: `Mock note content for version ${5 - i}`,
        version_number: 5 - i,
        created_at: new Date(Date.now() - i * 86400000).toISOString(), // Each version 1 day apart
        created_by: 'system',
        attachments: i % 2 === 0 ? [{ // Every other version has attachments
          id: uuidv4(),
          filename: `attachment-${i}.pdf`,
          path: `/mock-storage/meetings/${meetingId}/attachments/attachment-${i}.pdf`,
          content_type: 'application/pdf',
          size: 1024 * 1024 * (i + 1), // Random size
          url: `/mock-storage/meetings/${meetingId}/attachments/attachment-${i}.pdf`
        }] : []
      }));
      
      console.log('Returning mock versions:', mockVersions);
      return mockVersions;
    }
    
    // Real implementation with Supabase
    console.log('Getting note versions for meeting:', meetingId);
    
    const { data, error } = await supabase
      .from('note_versions')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('version_number', { ascending: false });
    
    if (error) {
      console.error('Error fetching note versions:', error);
      throw new Error(`Failed to fetch note versions: ${error.message}`);
    }
    
    console.log(`Found ${data?.length || 0} versions for meeting ${meetingId}`);
    return data as NoteVersion[];
  } catch (error) {
    console.error('Error in getNoteVersions:', error);
    throw error;
  }
}

/**
 * Get a specific version of notes
 */
export async function getNoteVersion(versionId: string): Promise<NoteVersion> {
  try {
    // Check if we should use mock data
    const useMockData = getMockDataStatus();
    
    if (useMockData) {
      // Mock implementation
      console.log('Getting mock note version:', versionId);
      
      // Generate a mock version
      const mockVersion: NoteVersion = {
        id: versionId,
        meeting_id: 'mock-meeting-id',
        content: `Mock note content for version with ID ${versionId}`,
        version_number: 1,
        created_at: new Date().toISOString(),
        created_by: 'system',
        attachments: [{
          id: uuidv4(),
          filename: 'mock-attachment.pdf',
          path: '/mock-storage/attachments/mock-attachment.pdf',
          content_type: 'application/pdf',
          size: 1024 * 1024, // 1MB
          url: '/mock-storage/attachments/mock-attachment.pdf'
        }]
      };
      
      console.log('Returning mock version:', mockVersion);
      return mockVersion;
    }
    
    // Real implementation with Supabase
    console.log('Getting note version:', versionId);
    
    const { data, error } = await supabase
      .from('note_versions')
      .select('*')
      .eq('id', versionId)
      .single();
    
    if (error) {
      console.error('Error fetching note version:', error);
      throw new Error(`Failed to fetch note version: ${error.message}`);
    }
    
    console.log('Found version:', data);
    return data as NoteVersion;
  } catch (error) {
    console.error('Error in getNoteVersion:', error);
    throw error;
  }
}

/**
 * Compare two versions and generate a diff
 */
export function compareVersions(oldVersion: NoteVersion, newVersion: NoteVersion): VersionDiff {
  // Split content into lines
  const oldLines = oldVersion.content.split('\n');
  const newLines = newVersion.content.split('\n');
  
  // Simple diff algorithm (in a real app, you'd use a more sophisticated diff algorithm)
  const addedLines: string[] = [];
  const removedLines: string[] = [];
  const changedLines: Array<{ old: string; new: string }> = [];
  
  // Find added and removed lines
  for (const line of newLines) {
    if (!oldLines.includes(line)) {
      addedLines.push(line);
    }
  }
  
  for (const line of oldLines) {
    if (!newLines.includes(line)) {
      removedLines.push(line);
    }
  }
  
  // Find changed lines (simplified approach)
  for (let i = 0; i < Math.min(oldLines.length, newLines.length); i++) {
    if (oldLines[i] !== newLines[i] && !addedLines.includes(newLines[i]) && !removedLines.includes(oldLines[i])) {
      changedLines.push({
        old: oldLines[i],
        new: newLines[i]
      });
    }
  }
  
  // Compare attachments
  const oldAttachmentNames = (oldVersion.attachments || []).map(a => a.filename);
  const newAttachmentNames = (newVersion.attachments || []).map(a => a.filename);
  
  const addedAttachments = newAttachmentNames.filter(name => !oldAttachmentNames.includes(name));
  const removedAttachments = oldAttachmentNames.filter(name => !newAttachmentNames.includes(name));
  
  return {
    previous_version_id: oldVersion.id,
    current_version_id: newVersion.id,
    added_lines: addedLines,
    removed_lines: removedLines,
    changed_lines: changedLines,
    added_attachments: addedAttachments,
    removed_attachments: removedAttachments
  };
} 