'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, BookOpen, FileText, Lightbulb, HelpCircle, Link } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useKnowledgeBase, KnowledgeDocument, PromptTemplate } from '@/hooks/useKnowledgeBase';
import { AI_TOOL_OPTIONS } from '@/types/rag';

const DOCUMENT_TYPES = [
  { value: 'best_practice', label: 'Best Practice', icon: Lightbulb },
  { value: 'example', label: 'Example', icon: FileText },
  { value: 'template', label: 'Template', icon: FileText },
  { value: 'guide', label: 'Guide', icon: BookOpen },
  { value: 'reference', label: 'Reference', icon: Link },
];

const CATEGORIES = [
  'ui_design', 'backend', 'database', 'authentication', 'deployment',
  'testing', 'performance', 'security', 'responsive', 'accessibility'
];

const COMPLEXITY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-800' },
];

export function KnowledgeBaseManager() {
  const {
    documents,
    templates,
    isLoading,
    error,
    searchDocuments,
    searchTemplates,
    addDocument,
    addTemplate,
    deleteDocument,
    deleteTemplate,
  } = useKnowledgeBase();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('documents');

  // Form state for adding new documents/templates
  const [newDocument, setNewDocument] = useState<Partial<KnowledgeDocument>>({
    title: '',
    content: '',
    document_type: 'guide',
    target_tools: [],
    categories: [],
    complexity_level: 'intermediate',
    tags: [],
  });

  const [newTemplate, setNewTemplate] = useState<Partial<PromptTemplate>>({
    template_name: '',
    template_content: '',
    template_type: 'feature',
    target_tool: 'lovable',
    use_case: '',
    project_complexity: 'medium',
    required_variables: [],
  });

  // Load initial data
  useEffect(() => {
    searchDocuments();
    searchTemplates();
  }, [searchDocuments, searchTemplates]);

  // Handle search
  const handleSearch = () => {
    const searchOptions = {
      query: searchQuery || undefined,
      categories: selectedCategory ? [selectedCategory] : undefined,
      complexity: selectedComplexity || undefined,
      target_tools: selectedTool ? [selectedTool] : undefined,
    };

    if (activeTab === 'documents') {
      searchDocuments(searchOptions);
    } else {
      searchTemplates({
        ...searchOptions,
        target_tool: selectedTool || undefined,
      });
    }
  };

  // Handle adding new document
  const handleAddDocument = async () => {
    try {
      await addDocument(newDocument as Omit<KnowledgeDocument, 'id'>);
      setIsAddDialogOpen(false);
      setNewDocument({
        title: '',
        content: '',
        document_type: 'guide',
        target_tools: [],
        categories: [],
        complexity_level: 'intermediate',
        tags: [],
      });
    } catch (error) {
      console.error('Failed to add document:', error);
    }
  };

  // Handle adding new template
  const handleAddTemplate = async () => {
    try {
      await addTemplate(newTemplate as Omit<PromptTemplate, 'id'>);
      setIsAddDialogOpen(false);
      setNewTemplate({
        template_name: '',
        template_content: '',
        template_type: 'feature',
        target_tool: 'lovable',
        use_case: '',
        project_complexity: 'medium',
        required_variables: [],
      });
    } catch (error) {
      console.error('Failed to add template:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Base Manager</h2>
          <p className="text-muted-foreground">
            Manage your RAG knowledge base documents and prompt templates.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add {activeTab === 'documents' ? 'Document' : 'Template'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Add New {activeTab === 'documents' ? 'Knowledge Document' : 'Prompt Template'}
              </DialogTitle>
              <DialogDescription>
                {activeTab === 'documents' 
                  ? 'Add a new document to the knowledge base for RAG retrieval.'
                  : 'Add a new prompt template for generating optimized prompts.'
                }
              </DialogDescription>
            </DialogHeader>
            
            {activeTab === 'documents' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-title">Title</Label>
                  <Input
                    id="doc-title"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                    placeholder="Enter document title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-content">Content</Label>
                  <Textarea
                    id="doc-content"
                    value={newDocument.content}
                    onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                    placeholder="Enter document content..."
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select
                      value={newDocument.document_type}
                      onValueChange={(value: any) => setNewDocument({ ...newDocument, document_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Complexity Level</Label>
                    <Select
                      value={newDocument.complexity_level}
                      onValueChange={(value: any) => setNewDocument({ ...newDocument, complexity_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLEXITY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Tools (comma-separated)</Label>
                  <Input
                    value={newDocument.target_tools?.join(', ')}
                    onChange={(e) => setNewDocument({ 
                      ...newDocument, 
                      target_tools: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="lovable, cursor, v0..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categories (comma-separated)</Label>
                  <Input
                    value={newDocument.categories?.join(', ')}
                    onChange={(e) => setNewDocument({ 
                      ...newDocument, 
                      categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="ui_design, backend, database..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDocument} disabled={!newDocument.title || !newDocument.content}>
                    Add Document
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.template_name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, template_name: e.target.value })}
                    placeholder="Enter template name..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-content">Template Content</Label>
                  <Textarea
                    id="template-content"
                    value={newTemplate.template_content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, template_content: e.target.value })}
                    placeholder="Enter template content with variables like {variable_name}..."
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Type</Label>
                    <Select
                      value={newTemplate.template_type}
                      onValueChange={(value: any) => setNewTemplate({ ...newTemplate, template_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skeleton">Skeleton</SelectItem>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="optimization">Optimization</SelectItem>
                        <SelectItem value="debugging">Debugging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Tool</Label>
                    <Select
                      value={newTemplate.target_tool}
                      onValueChange={(value: any) => setNewTemplate({ ...newTemplate, target_tool: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_TOOL_OPTIONS.map((tool) => (
                          <SelectItem key={tool.id} value={tool.id}>
                            {tool.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="use-case">Use Case</Label>
                  <Input
                    id="use-case"
                    value={newTemplate.use_case}
                    onChange={(e) => setNewTemplate({ ...newTemplate, use_case: e.target.value })}
                    placeholder="Describe when to use this template..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTemplate} disabled={!newTemplate.template_name || !newTemplate.template_content}>
                    Add Template
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  {COMPLEXITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTool} onValueChange={setSelectedTool}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Tools</SelectItem>
                  {AI_TOOL_OPTIONS.map((tool) => (
                    <SelectItem key={tool.id} value={tool.id}>
                      {tool.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} disabled={isLoading}>
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents">
            Knowledge Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            Prompt Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your knowledge base by adding documents.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    Add First Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{doc.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => doc.id && deleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{doc.document_type}</Badge>
                      <Badge className={COMPLEXITY_LEVELS.find(l => l.value === doc.complexity_level)?.color}>
                        {doc.complexity_level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {doc.content}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Tools:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.target_tools.map((tool) => (
                            <Badge key={tool} variant="secondary" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Categories:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.categories.slice(0, 3).map((category) => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                          {doc.categories.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{doc.categories.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create prompt templates to improve RAG generation quality.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    Add First Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{template.template_name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => template.id && deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{template.template_type}</Badge>
                      <Badge variant="secondary">{template.target_tool}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {template.template_content}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Use Case:</Label>
                        <p className="text-sm">{template.use_case}</p>
                      </div>
                      {template.usage_count !== undefined && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Used: {template.usage_count} times</span>
                          {template.success_rate !== undefined && (
                            <span>Success: {(template.success_rate * 100).toFixed(1)}%</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
