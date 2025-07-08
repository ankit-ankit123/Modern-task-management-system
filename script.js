// Task Management Application
class TaskManager {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.tasks = [];
        this.editingTask = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupTheme();
        this.render();
    }

    // Data Management
    loadData() {
        const savedProjects = localStorage.getItem('taskflow-projects');
        const savedTasks = localStorage.getItem('taskflow-tasks');
        const savedCurrentProject = localStorage.getItem('taskflow-current-project');

        if (savedProjects) {
            this.projects = JSON.parse(savedProjects);
        } else {
            // Create default project
            this.projects = [{
                id: 'default',
                name: 'Personal Tasks',
                color: '#3b82f6',
                createdAt: new Date().toISOString()
            }];
        }

        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }

        if (savedCurrentProject) {
            this.currentProject = savedCurrentProject;
        } else {
            this.currentProject = this.projects[0]?.id || 'default';
        }
    }

    saveData() {
        localStorage.setItem('taskflow-projects', JSON.stringify(this.projects));
        localStorage.setItem('taskflow-tasks', JSON.stringify(this.tasks));
        localStorage.setItem('taskflow-current-project', this.currentProject);
    }

    // Theme Management
    setupTheme() {
        const savedTheme = localStorage.getItem('taskflow-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('taskflow-theme', newTheme);
    }

    // Event Listeners
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Add project button
        document.getElementById('addProjectBtn').addEventListener('click', () => {
            this.showProjectModal();
        });

        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showTaskModal();
        });

        // Modal close buttons
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideTaskModal();
        });

        document.getElementById('closeProjectModal').addEventListener('click', () => {
            this.hideProjectModal();
        });

        // Form submissions
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskSubmit();
        });

        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProjectSubmit();
        });

        // Cancel buttons
        document.getElementById('cancelTask').addEventListener('click', () => {
            this.hideTaskModal();
        });

        document.getElementById('cancelProject').addEventListener('click', () => {
            this.hideProjectModal();
        });

        // Close modal on backdrop click
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideTaskModal();
            }
        });

        document.getElementById('projectModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideProjectModal();
            }
        });

        // Setup drag and drop
        this.setupDragAndDrop();
    }

    // Drag and Drop
    setupDragAndDrop() {
        const taskColumns = document.querySelectorAll('.task-list');
        
        taskColumns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.closest('.task-column').classList.add('drag-over');
            });

            column.addEventListener('dragleave', (e) => {
                if (!column.contains(e.relatedTarget)) {
                    column.closest('.task-column').classList.remove('drag-over');
                }
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.closest('.task-column').classList.remove('drag-over');
                
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.closest('.task-column').dataset.status;
                
                this.updateTaskStatus(taskId, newStatus);
            });
        });
    }

    // Project Management
    showProjectModal() {
        document.getElementById('projectModal').classList.add('active');
        document.getElementById('projectName').focus();
    }

    hideProjectModal() {
        document.getElementById('projectModal').classList.remove('active');
        document.getElementById('projectForm').reset();
    }

    handleProjectSubmit() {
        const name = document.getElementById('projectName').value.trim();
        const color = document.getElementById('projectColor').value;

        if (!name) return;

        const project = {
            id: Date.now().toString(),
            name,
            color,
            createdAt: new Date().toISOString()
        };

        this.projects.push(project);
        this.saveData();
        this.renderProjects();
        this.hideProjectModal();
        this.showToast('Project created successfully!', 'success');
    }

    deleteProject(projectId) {
        if (this.projects.length === 1) {
            this.showToast('Cannot delete the last project!', 'error');
            return;
        }

        this.projects = this.projects.filter(p => p.id !== projectId);
        this.tasks = this.tasks.filter(t => t.projectId !== projectId);
        
        if (this.currentProject === projectId) {
            this.currentProject = this.projects[0].id;
        }
        
        this.saveData();
        this.render();
        this.showToast('Project deleted successfully!', 'success');
    }

    switchProject(projectId) {
        this.currentProject = projectId;
        this.saveData();
        this.render();
    }

    // Task Management
    showTaskModal(task = null) {
        this.editingTask = task;
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        
        if (task) {
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskDueDate').value = task.dueDate || '';
            document.getElementById('saveTask').textContent = 'Update Task';
        } else {
            document.getElementById('modalTitle').textContent = 'Add New Task';
            form.reset();
            document.getElementById('saveTask').textContent = 'Save Task';
        }
        
        modal.classList.add('active');
        document.getElementById('taskTitle').focus();
    }

    hideTaskModal() {
        document.getElementById('taskModal').classList.remove('active');
        document.getElementById('taskForm').reset();
        this.editingTask = null;
    }

    handleTaskSubmit() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const dueDate = document.getElementById('taskDueDate').value;

        if (!title) return;

        if (this.editingTask) {
            // Update existing task
            const taskIndex = this.tasks.findIndex(t => t.id === this.editingTask.id);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = {
                    ...this.tasks[taskIndex],
                    title,
                    description,
                    priority,
                    dueDate,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Create new task
            const task = {
                id: Date.now().toString(),
                title,
                description,
                priority,
                dueDate,
                status: 'pending',
                projectId: this.currentProject,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.tasks.push(task);
        }

        this.saveData();
        this.renderTasks();
        this.hideTaskModal();
        this.showToast(this.editingTask ? 'Task updated successfully!' : 'Task created successfully!', 'success');
    }

    updateTaskStatus(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
            task.updatedAt = new Date().toISOString();
            this.saveData();
            this.renderTasks();
            this.showToast('Task status updated!', 'success');
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData();
        this.renderTasks();
        this.showToast('Task deleted successfully!', 'success');
    }

    // Rendering
    render() {
        this.renderProjects();
        this.renderTasks();
    }

    renderProjects() {
        const projectsList = document.getElementById('projectsList');
        const currentProjectName = document.getElementById('currentProjectName');
        
        projectsList.innerHTML = '';
        
        this.projects.forEach(project => {
            const projectTasks = this.tasks.filter(t => t.projectId === project.id);
            const projectElement = document.createElement('div');
            projectElement.className = `project-item ${project.id === this.currentProject ? 'active' : ''}`;
            projectElement.innerHTML = `
                <div class="project-color" style="background-color: ${project.color}"></div>
                <span class="project-name">${project.name}</span>
                <span class="project-task-count">${projectTasks.length}</span>
            `;
            
            projectElement.addEventListener('click', () => {
                this.switchProject(project.id);
            });
            
            // Add context menu for project deletion
            projectElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to delete this project?')) {
                    this.deleteProject(project.id);
                }
            });
            
            projectsList.appendChild(projectElement);
        });
        
        // Update current project name
        const currentProject = this.projects.find(p => p.id === this.currentProject);
        if (currentProject) {
            currentProjectName.textContent = currentProject.name;
        }
    }

    renderTasks() {
        const currentProjectTasks = this.tasks.filter(t => t.projectId === this.currentProject);
        
        // Update task counts
        const taskCount = document.getElementById('taskCount');
        const pendingCount = document.getElementById('pendingCount');
        const inProgressCount = document.getElementById('inProgressCount');
        const completedCount = document.getElementById('completedCount');
        
        const pending = currentProjectTasks.filter(t => t.status === 'pending');
        const inProgress = currentProjectTasks.filter(t => t.status === 'in-progress');
        const completed = currentProjectTasks.filter(t => t.status === 'completed');
        
        taskCount.textContent = `${currentProjectTasks.length} tasks`;
        pendingCount.textContent = pending.length;
        inProgressCount.textContent = inProgress.length;
        completedCount.textContent = completed.length;
        
        // Render task lists
        this.renderTaskList('pendingTasks', pending);
        this.renderTaskList('inProgressTasks', inProgress);
        this.renderTaskList('completedTasks', completed);
    }

    renderTaskList(containerId, tasks) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (tasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3 8-8"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9"/>
                </svg>
                <h3>No tasks yet</h3>
                <p>Tasks will appear here when you add them</p>
            `;
            container.appendChild(emptyState);
            return;
        }
        
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card';
        taskElement.draggable = true;
        
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
        
        taskElement.innerHTML = `
            <div class="task-priority ${task.priority}"></div>
            <div class="task-title">${task.title}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-meta">
                ${task.dueDate ? `<span class="task-due-date ${isOverdue ? 'overdue' : ''}">${this.formatDate(task.dueDate)}</span>` : '<span></span>'}
                <div class="task-actions">
                    <button class="task-action-btn edit-btn" title="Edit task">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="task-action-btn delete-btn" title="Delete task">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <path d="M10 11v6M14 11v6"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        taskElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            taskElement.classList.add('dragging');
        });
        
        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
        });
        
        // Edit button
        taskElement.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showTaskModal(task);
        });
        
        // Delete button
        taskElement.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this task?')) {
                this.deleteTask(task.id);
            }
        });
        
        return taskElement;
    }

    // Utility Methods
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Tomorrow';
        } else if (diffDays === -1) {
            return 'Yesterday';
        } else if (diffDays > 0) {
            return `In ${diffDays} days`;
        } else {
            return `${Math.abs(diffDays)} days ago`;
        }
    }

    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-content">
                <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${type === 'success' ? 
                        '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M9 11l3 3 8-8"/>' : 
                        '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>'
                    }
                </svg>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});