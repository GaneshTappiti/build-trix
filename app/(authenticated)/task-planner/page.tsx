"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  PlusCircle, 
  Search, 
  Calendar as CalendarIcon, 
  User, 
  Clock, 
  CheckCircle2, 
  Circle, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Menu, 
  CalendarDays, 
  List, 
  Grid3X3, 
  ChevronDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string;
  assignee?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function TaskPlannerPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<"calendar" | "kanban" | "list">("calendar");
  const { toast } = useToast();

  // Start with some sample tasks to demonstrate calendar functionality
  useEffect(() => {
    // Create some sample tasks with different dates
    const sampleTasks: Task[] = [
      {
        id: "1",
        title: "Launch MVP",
        description: "Deploy the minimum viable product to production",
        status: "in-progress",
        priority: "high",
        dueDate: format(new Date(), 'yyyy-MM-dd'), // Today
        assignee: "John Doe",
        tags: ["development", "launch"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "2",
        title: "User Testing",
        description: "Conduct user interviews and gather feedback",
        status: "todo",
        priority: "medium",
        dueDate: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'), // Tomorrow
        assignee: "Jane Smith",
        tags: ["testing", "ux"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "3",
        title: "Market Research",
        description: "Analyze competitor landscape and market opportunities",
        status: "done",
        priority: "low",
        dueDate: format(new Date(Date.now() + 2 * 86400000), 'yyyy-MM-dd'), // Day after tomorrow
        assignee: "Mike Johnson",
        tags: ["research", "strategy"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setTasks(sampleTasks);
    setLoading(false);
  }, []);

  // Optimized filtering with useMemo for better performance
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
      const matchesAssignee = filterAssignee === "all" || task.assignee === filterAssignee;
      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, filterPriority, filterAssignee]);

  // Get tasks for selected date
  const getTasksForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return filteredTasks.filter(task => task.dueDate === dateString);
  };

  // Get dates that have tasks
  const getDatesWithTasks = () => {
    const dates = new Set<string>();
    filteredTasks.forEach(task => {
      if (task.dueDate) {
        dates.add(task.dueDate);
      }
    });
    return Array.from(dates).map(dateString => parseISO(dateString));
  };

  // Optimized task grouping by status
  const tasksByStatus = useMemo(() => ({
    todo: filteredTasks.filter(task => task.status === "todo"),
    "in-progress": filteredTasks.filter(task => task.status === "in-progress"),
    done: filteredTasks.filter(task => task.status === "done")
  }), [filteredTasks]);

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
      setIsNewTaskModalOpen(false);
      toast({
        title: "Success",
        description: "Task created successfully"
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTask = (taskData: Task) => {
    try {
      const updatedTasks = tasks.map(task =>
        task.id === taskData.id
          ? { ...taskData, updatedAt: new Date().toISOString() }
          : task
      );
      setTasks(updatedTasks);
      setIsEditTaskModalOpen(false);
      setSelectedTask(null);
      toast({
        title: "Success",
        description: "Task updated successfully"
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    try {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      toast({
        title: "Success",
        description: "Task deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    );
    setTasks(updatedTasks);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="bg-black/40 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-white text-sm font-medium leading-tight">
            {task.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black/90 backdrop-blur-sm border-white/10">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTask(task);
                  setIsEditTaskModalOpen(true);
                }}
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-gray-400 text-xs leading-relaxed">
          {task.description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          <Badge className={`text-xs px-2 py-1 ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
          {task.assignee && task.assignee !== "unassigned" && (
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs px-2 py-1">
              <User className="h-3 w-3 mr-1" />
              {task.assignee}
            </Badge>
          )}
        </div>

        {task.dueDate && (
          <div className="flex items-center text-gray-400 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs px-2 py-0.5 bg-white/5 border-white/20 text-gray-300">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center text-gray-300 hover:text-white transition-colors">
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          
          <Button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Task Planner</h1>
          <p className="text-gray-400">
            Organize and track your startup tasks with our interactive calendar and Kanban board
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white">Loading tasks...</div>
          </div>
        ) : (
          <>
            {/* Filters and Search */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/20 border-white/10 text-white placeholder-gray-400"
                  aria-label="Search tasks"
                />
              </div>

              {/* Date Period Selector */}
              <Select
                onValueChange={(value) => {
                  // Handle date period changes
                  const today = new Date();
                  switch (value) {
                    case "today":
                      setSelectedDate(today);
                      break;
                    case "week":
                      // Set to start of week
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - today.getDay());
                      setSelectedDate(startOfWeek);
                      break;
                    case "month":
                      // Set to start of month
                      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                      setSelectedDate(startOfMonth);
                      break;
                    default:
                      setSelectedDate(today);
                  }
                }}
              >
                <SelectTrigger className="w-40 bg-black/20 border-white/10 text-white">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40 bg-black/20 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-40 bg-black/20 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="John Doe">John Doe</SelectItem>
                  <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                  <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                  <SelectItem value="Sarah Wilson">Sarah Wilson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <Tabs value={calendarView} onValueChange={(value) => setCalendarView(value as "calendar" | "kanban" | "list")} className="mb-6">
              <TabsList className="bg-black/20 border-white/10">
                <TabsTrigger value="calendar" className="data-[state=active]:bg-green-600">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Calendar View
                </TabsTrigger>
                <TabsTrigger value="kanban" className="data-[state=active]:bg-green-600">
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Kanban Board
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-green-600">
                  <List className="h-4 w-4 mr-2" />
                  List View
                </TabsTrigger>
              </TabsList>

              {/* Calendar View */}
              <TabsContent value="calendar" className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Calendar */}
                  <div className="lg:col-span-2">
                    <Card className="bg-black/40 backdrop-blur-sm border-white/10">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white">Task Calendar</CardTitle>
                          <Button
                            onClick={() => setSelectedDate(new Date())}
                            className="bg-black/20 border-white/10 text-white hover:bg-white/10 text-xs"
                          >
                            Today
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          className="rounded-md border-0"
                          disabled={(date) => date < new Date("1900-01-01")}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tasks for selected date */}
                  <div>
                    <Card className="bg-black/40 backdrop-blur-sm border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">
                          Tasks for {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Selected Date'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedDate && getTasksForDate(selectedDate).length > 0 ? (
                          getTasksForDate(selectedDate).map(task => (
                            <div key={task.id} className="p-3 bg-black/20 rounded-lg border border-white/10">
                              <h4 className="text-white font-medium text-sm mb-1">{task.title}</h4>
                              <Badge className={`text-xs mb-2 ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                              <p className="text-gray-400 text-xs mb-2">{task.description}</p>
                              <Badge className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                                {task.status.replace('-', ' ')}
                              </Badge>
                              <Button
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsEditTaskModalOpen(true);
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white mt-2 h-6 text-xs"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400 mb-4">No tasks for this date</p>
                            <Button
                              onClick={() => {
                                // Set the due date to selected date when creating new task
                                setIsNewTaskModalOpen(true);
                              }}
                              variant="outline"
                              className="text-green-400 hover:text-green-300 mt-2"
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Add Task for This Date
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick stats */}
                    <Card className="bg-black/40 backdrop-blur-sm border-white/10 mt-6">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Tasks</span>
                          <span className="text-white font-medium">{filteredTasks.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Completed</span>
                          <span className="text-green-400 font-medium">{tasksByStatus.done.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">In Progress</span>
                          <span className="text-yellow-400 font-medium">{tasksByStatus["in-progress"].length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">To Do</span>
                          <span className="text-blue-400 font-medium">{tasksByStatus.todo.length}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Kanban Board */}
              <TabsContent value="kanban" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* To Do Column */}
                  <Card className="bg-black/40 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Circle className="h-4 w-4 mr-2 text-blue-400" />
                        To Do ({tasksByStatus.todo.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {tasksByStatus.todo.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {tasksByStatus.todo.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No tasks to do</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* In Progress Column */}
                  <Card className="bg-black/40 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-yellow-400" />
                        In Progress ({tasksByStatus["in-progress"].length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {tasksByStatus["in-progress"].map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {tasksByStatus["in-progress"].length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No tasks in progress</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Done Column */}
                  <Card className="bg-black/40 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                        Done ({tasksByStatus.done.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {tasksByStatus.done.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {tasksByStatus.done.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No completed tasks</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* List View */}
              <TabsContent value="list" className="space-y-6">
                <Card className="bg-black/40 backdrop-blur-sm border-white/10">
                  <CardContent className="p-6">
                    {filteredTasks.length > 0 ? (
                      <div className="space-y-4">
                        {filteredTasks.map(task => (
                          <div key={task.id} className="p-4 bg-black/20 rounded-lg border border-white/10 hover:border-white/20 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-white font-medium">{task.title}</h4>
                                  <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </Badge>
                                  <Badge className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                                    {task.status.replace('-', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                  {task.assignee && task.assignee !== "unassigned" && (
                                    <div className="flex items-center">
                                      <User className="h-3 w-3 mr-1" />
                                      {task.assignee}
                                    </div>
                                  )}
                                  {task.dueDate && (
                                    <div className="flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setIsEditTaskModalOpen(true);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-300 hover:text-white hover:bg-white/10"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteTask(task.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <h3 className="text-white text-lg font-medium mb-2">No tasks found</h3>
                        <p className="text-gray-400 mb-6">
                          {tasks.length === 0
                            ? "Get started by creating your first task"
                            : "Try adjusting your search or filters"
                          }
                        </p>
                        <Button
                          onClick={() => setIsNewTaskModalOpen(true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Task
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* New Task Modal */}
      <TaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        title="Create New Task"
        selectedDate={calendarView === "calendar" ? selectedDate : undefined}
      />

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={isEditTaskModalOpen}
        onClose={() => {
          setIsEditTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={handleUpdateTask}
        title="Edit Task"
        initialTask={selectedTask}
      />
    </div>
  );
}

// Task Modal Component
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: any) => void;
  title: string;
  initialTask?: Task | null;
  selectedDate?: Date;
}

const TaskModal = ({ isOpen, onClose, onSubmit, title, initialTask, selectedDate }: TaskModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    dueDate: "",
    assignee: "unassigned",
    tags: [] as string[]
  });
  const [date, setDate] = useState<Date | undefined>();

  useEffect(() => {
    if (initialTask) {
      setFormData({
        title: initialTask.title,
        description: initialTask.description,
        status: initialTask.status,
        priority: initialTask.priority,
        dueDate: initialTask.dueDate,
        assignee: initialTask.assignee || "unassigned",
        tags: initialTask.tags
      });
      if (initialTask.dueDate) {
        setDate(parseISO(initialTask.dueDate));
      }
    } else {
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
        assignee: "unassigned",
        tags: []
      });
      // If selectedDate is provided, use it as the default due date
      setDate(selectedDate || undefined);
    }
  }, [initialTask, isOpen, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Task title is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Task description is required",
        variant: "destructive"
      });
      return;
    }

    if (!date) {
      toast({
        title: "Validation Error",
        description: "Please select a due date",
        variant: "destructive"
      });
      return;
    }

    const finalFormData = {
      ...formData,
      dueDate: date ? format(date, 'yyyy-MM-dd') : ""
    };

    if (initialTask) {
      onSubmit({ ...initialTask, ...finalFormData });
    } else {
      onSubmit(finalFormData);
    }

    toast({
      title: "Success",
      description: initialTask ? "Task updated successfully" : "Task created successfully"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 backdrop-blur-sm border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-300">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-black/20 border-white/10 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-300">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-black/20 border-white/10 text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="text-gray-300">Status</Label>
              <Select value={formData.status} onValueChange={(value: Task["status"]) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority" className="text-gray-300">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: Task["priority"]) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="assignee" className="text-gray-300">Assignee</Label>
            <Select value={formData.assignee} onValueChange={(value) => setFormData({ ...formData, assignee: value })}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="John Doe">John Doe</SelectItem>
                <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                <SelectItem value="Sarah Wilson">Sarah Wilson</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dueDate" className="text-gray-300">Due Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-black/20 border-white/10 text-white hover:bg-black/30",
                    !date && "text-gray-400"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-black/90 backdrop-blur-sm border-white/10" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="rounded-md border-0"
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-black/20 border-white/10 text-white hover:bg-black/30"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
            >
              {initialTask ? "Update" : "Create"} Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
