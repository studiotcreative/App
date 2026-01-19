import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Palette, Target, MessageSquare, Sparkles } from 'lucide-react';

export default function BrandGuidelinesForm({ guidelines, onSave, loading }) {
  const [formData, setFormData] = useState(guidelines || {
    business_description: '',
    brand_mission: '',
    target_audience: '',
    content_pillars: [],
    tone_of_voice: 'professional',
    style_keywords: [],
    primary_colors: [],
    fonts: '',
    do_list: [],
    dont_list: [],
    hashtag_strategy: '',
    posting_frequency: '',
    competitor_accounts: [],
    inspiration_accounts: [],
    additional_notes: ''
  });

  const [newPillar, setNewPillar] = useState('');
  const [newStyle, setNewStyle] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [newDo, setNewDo] = useState('');
  const [newDont, setNewDont] = useState('');
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newInspiration, setNewInspiration] = useState('');

  const addToArray = (field, value, setter) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }));
      setter('');
    }
  };

  const removeFromArray = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Brand Overview
          </CardTitle>
          <CardDescription>Define the brand's identity and mission</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Business Description</Label>
            <Textarea
              value={formData.business_description}
              onChange={(e) => setFormData({...formData, business_description: e.target.value})}
              placeholder="What does this business do? What makes it unique?"
              rows={3}
            />
          </div>
          <div>
            <Label>Brand Mission</Label>
            <Textarea
              value={formData.brand_mission}
              onChange={(e) => setFormData({...formData, brand_mission: e.target.value})}
              placeholder="Brand's mission statement or core purpose"
              rows={2}
            />
          </div>
          <div>
            <Label>Target Audience</Label>
            <Textarea
              value={formData.target_audience}
              onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
              placeholder="Demographics, interests, pain points of ideal customers"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Content Strategy
          </CardTitle>
          <CardDescription>Define content themes and approach</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Content Pillars</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newPillar}
                onChange={(e) => setNewPillar(e.target.value)}
                placeholder="e.g., Product Features, Customer Stories, Industry Tips"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('content_pillars', newPillar, setNewPillar))}
              />
              <Button type="button" onClick={() => addToArray('content_pillars', newPillar, setNewPillar)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.content_pillars?.map((pillar, i) => (
                <div key={i} className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="text-sm">{pillar}</span>
                  <button type="button" onClick={() => removeFromArray('content_pillars', i)}>
                    <X className="w-3 h-3 text-blue-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Hashtag Strategy</Label>
            <Textarea
              value={formData.hashtag_strategy}
              onChange={(e) => setFormData({...formData, hashtag_strategy: e.target.value})}
              placeholder="Guidelines for hashtag usage, branded hashtags, number per post"
              rows={2}
            />
          </div>

          <div>
            <Label>Posting Frequency</Label>
            <Input
              value={formData.posting_frequency}
              onChange={(e) => setFormData({...formData, posting_frequency: e.target.value})}
              placeholder="e.g., 3-4 times per week, daily at 10am and 3pm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Voice & Style
          </CardTitle>
          <CardDescription>Define how the brand communicates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tone of Voice</Label>
            <Select value={formData.tone_of_voice} onValueChange={(value) => setFormData({...formData, tone_of_voice: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="playful">Playful</SelectItem>
                <SelectItem value="authoritative">Authoritative</SelectItem>
                <SelectItem value="inspirational">Inspirational</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Style Keywords</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newStyle}
                onChange={(e) => setNewStyle(e.target.value)}
                placeholder="e.g., modern, minimalist, bold, elegant"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('style_keywords', newStyle, setNewStyle))}
              />
              <Button type="button" onClick={() => addToArray('style_keywords', newStyle, setNewStyle)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.style_keywords?.map((keyword, i) => (
                <div key={i} className="bg-green-50 border border-green-200 px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="text-sm">{keyword}</span>
                  <button type="button" onClick={() => removeFromArray('style_keywords', i)}>
                    <X className="w-3 h-3 text-green-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Do's - What to Include</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newDo}
                onChange={(e) => setNewDo(e.target.value)}
                placeholder="e.g., Use customer testimonials, Include call-to-action"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('do_list', newDo, setNewDo))}
              />
              <Button type="button" onClick={() => addToArray('do_list', newDo, setNewDo)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ul className="space-y-1">
              {formData.do_list?.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span className="flex-1">{item}</span>
                  <button type="button" onClick={() => removeFromArray('do_list', i)}>
                    <X className="w-3 h-3 text-gray-400 hover:text-red-600" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label>Don'ts - What to Avoid</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newDont}
                onChange={(e) => setNewDont(e.target.value)}
                placeholder="e.g., Avoid political content, Don't use competitor names"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('dont_list', newDont, setNewDont))}
              />
              <Button type="button" onClick={() => addToArray('dont_list', newDont, setNewDont)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ul className="space-y-1">
              {formData.dont_list?.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span className="flex-1">{item}</span>
                  <button type="button" onClick={() => removeFromArray('dont_list', i)}>
                    <X className="w-3 h-3 text-gray-400 hover:text-red-600" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-pink-600" />
            Visual Identity
          </CardTitle>
          <CardDescription>Brand colors and visual elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Primary Colors</Label>
            <div className="flex gap-2 mb-2">
              <Input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-20 h-10 p-1 cursor-pointer"
              />
              <Input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
              <Button type="button" onClick={() => addToArray('primary_colors', newColor, setNewColor)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.primary_colors?.map((color, i) => (
                <div key={i} className="border rounded-lg p-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded" style={{backgroundColor: color}}></div>
                  <span className="text-sm font-mono">{color}</span>
                  <button type="button" onClick={() => removeFromArray('primary_colors', i)}>
                    <X className="w-3 h-3 text-gray-400 hover:text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Fonts</Label>
            <Input
              value={formData.fonts}
              onChange={(e) => setFormData({...formData, fonts: e.target.value})}
              placeholder="e.g., Montserrat for headers, Open Sans for body"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competitive Intelligence</CardTitle>
          <CardDescription>Monitor competitors and find inspiration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Competitor Accounts</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                placeholder="@competitorhandle"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('competitor_accounts', newCompetitor, setNewCompetitor))}
              />
              <Button type="button" onClick={() => addToArray('competitor_accounts', newCompetitor, setNewCompetitor)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.competitor_accounts?.map((account, i) => (
                <div key={i} className="bg-orange-50 border border-orange-200 px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="text-sm">{account}</span>
                  <button type="button" onClick={() => removeFromArray('competitor_accounts', i)}>
                    <X className="w-3 h-3 text-orange-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Inspiration Accounts</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newInspiration}
                onChange={(e) => setNewInspiration(e.target.value)}
                placeholder="@inspirationhandle"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('inspiration_accounts', newInspiration, setNewInspiration))}
              />
              <Button type="button" onClick={() => addToArray('inspiration_accounts', newInspiration, setNewInspiration)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.inspiration_accounts?.map((account, i) => (
                <div key={i} className="bg-purple-50 border border-purple-200 px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="text-sm">{account}</span>
                  <button type="button" onClick={() => removeFromArray('inspiration_accounts', i)}>
                    <X className="w-3 h-3 text-purple-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.additional_notes}
            onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
            placeholder="Any other brand guidelines, special considerations, or notes"
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Brand Guidelines'}
        </Button>
      </div>
    </form>
  );
}