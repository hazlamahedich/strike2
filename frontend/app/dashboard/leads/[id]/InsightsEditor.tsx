'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { getLeadInsights } from '@/lib/api/leads';
import supabase from '@/lib/supabase/client';
import { toast } from 'sonner';

interface InsightsEditorProps {
  leadId: number;
  onClose: () => void;
  onUpdate: () => void;
}

export default function InsightsEditor({ leadId, onClose, onUpdate }: InsightsEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [conversionProbability, setConversionProbability] = useState(0.5);
  const [factors, setFactors] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [newFactor, setNewFactor] = useState({ factor: '', impact: 0.5, description: '' });
  const [newRecommendation, setNewRecommendation] = useState({ text: '', priority: 'medium' });

  // Load insights data
  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true);
        const data = await getLeadInsights(leadId);
        setInsights(data);
        setConversionProbability(data.conversion_probability || 0.5);
        setFactors(data.score_factors || []);
        setRecommendations(data.recommendations || []);
      } catch (error) {
        console.error('Error loading insights:', error);
        toast.error('Failed to load insights data');
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [leadId]);

  // Save insights data
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updatedInsights = {
        lead_id: leadId,
        score_factors: factors,
        recommendations: recommendations,
        conversion_probability: conversionProbability,
        last_calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('lead_insights')
        .upsert(updatedInsights, { onConflict: 'lead_id' });
      
      if (error) {
        throw error;
      }
      
      toast.success('Insights saved successfully');
      onUpdate();
    } catch (error) {
      console.error('Error saving insights:', error);
      toast.error('Failed to save insights');
    } finally {
      setSaving(false);
    }
  };

  // Add a new factor
  const handleAddFactor = () => {
    if (!newFactor.factor || !newFactor.description) {
      toast.error('Please fill in all factor fields');
      return;
    }
    
    setFactors([...factors, { ...newFactor }]);
    setNewFactor({ factor: '', impact: 0.5, description: '' });
  };

  // Remove a factor
  const handleRemoveFactor = (index: number) => {
    const updatedFactors = [...factors];
    updatedFactors.splice(index, 1);
    setFactors(updatedFactors);
  };

  // Add a new recommendation
  const handleAddRecommendation = () => {
    if (!newRecommendation.text) {
      toast.error('Please enter recommendation text');
      return;
    }
    
    setRecommendations([...recommendations, { ...newRecommendation }]);
    setNewRecommendation({ text: '', priority: 'medium' });
  };

  // Remove a recommendation
  const handleRemoveRecommendation = (index: number) => {
    const updatedRecommendations = [...recommendations];
    updatedRecommendations.splice(index, 1);
    setRecommendations(updatedRecommendations);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Lead Insights Editor</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="py-8 text-center">Loading insights data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Lead Insights Editor</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      {/* Conversion Probability */}
      <Card className="mb-6 p-4">
        <h3 className="text-lg font-medium mb-2">Conversion Probability</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="range"
              min="0"
              max="100"
              value={conversionProbability * 100}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setConversionProbability(parseInt(e.target.value) / 100)
              }
              className="w-full"
            />
          </div>
          <span className="w-16 text-right">{Math.round(conversionProbability * 100)}%</span>
        </div>
      </Card>
      
      {/* Score Factors */}
      <Card className="mb-6 p-4">
        <h3 className="text-lg font-medium mb-2">Score Factors</h3>
        
        {factors.length === 0 ? (
          <p className="text-gray-500 italic mb-4">No factors added yet</p>
        ) : (
          <div className="space-y-3 mb-4">
            {factors.map((factor, index) => (
              <div key={index} className="flex items-start p-3 border rounded-md">
                <div className="flex-1">
                  <div className="font-medium">{factor.factor}</div>
                  <div className="text-sm text-gray-600">{factor.description}</div>
                  <div className="mt-1 flex items-center">
                    <span className={`text-sm ${factor.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Impact: {factor.impact >= 0 ? '+' : ''}{factor.impact.toFixed(1)}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveFactor(index)}
                  className="text-red-500"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Add New Factor</h4>
          <div className="grid grid-cols-1 gap-3">
            <Input
              placeholder="Factor name"
              value={newFactor.factor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFactor({ ...newFactor, factor: e.target.value })}
            />
            <div className="flex items-center space-x-2">
              <span className="text-sm">Impact:</span>
              <div className="flex-1">
                <Input
                  type="range"
                  min="-100"
                  max="100"
                  value={(newFactor.impact + 1) * 50}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const normalizedValue = (parseInt(e.target.value) / 50) - 1;
                    setNewFactor({ ...newFactor, impact: parseFloat(normalizedValue.toFixed(1)) });
                  }}
                  className="w-full"
                />
              </div>
              <span className="w-12 text-right">
                {newFactor.impact >= 0 ? '+' : ''}{newFactor.impact.toFixed(1)}
              </span>
            </div>
            <Textarea
              placeholder="Description"
              value={newFactor.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewFactor({ ...newFactor, description: e.target.value })}
              rows={2}
            />
            <Button onClick={handleAddFactor}>Add Factor</Button>
          </div>
        </div>
      </Card>
      
      {/* Recommendations */}
      <Card className="mb-6 p-4">
        <h3 className="text-lg font-medium mb-2">Recommendations</h3>
        
        {recommendations.length === 0 ? (
          <p className="text-gray-500 italic mb-4">No recommendations added yet</p>
        ) : (
          <div className="space-y-3 mb-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start p-3 border rounded-md">
                <div className="flex-1">
                  <div className="font-medium">{rec.text}</div>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveRecommendation(index)}
                  className="text-red-500"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Add New Recommendation</h4>
          <div className="grid grid-cols-1 gap-3">
            <Textarea
              placeholder="Recommendation text"
              value={newRecommendation.text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewRecommendation({ ...newRecommendation, text: e.target.value })}
              rows={2}
            />
            <Select
              value={newRecommendation.priority}
              onValueChange={(value: string) => setNewRecommendation({ ...newRecommendation, priority: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddRecommendation}>Add Recommendation</Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 