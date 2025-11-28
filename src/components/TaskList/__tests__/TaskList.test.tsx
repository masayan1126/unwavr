import { render, screen } from "@testing-library/react";
import TaskList from "../index";
import { Task } from "@/lib/types";
import { useAppStore } from "@/lib/store";

// Mock dependencies
jest.mock("@/lib/store", () => ({
    useAppStore: jest.fn(),
}));

jest.mock("@/components/Providers", () => ({
    useConfirm: () => jest.fn(),
    useToast: () => ({ show: jest.fn() }),
}));

jest.mock("@/components/TaskForm", () => {
    return function DummyTaskForm() {
        return <div data-testid="task-form" />;
    };
});

// Mock framer-motion to avoid issues in tests
jest.mock("framer-motion", () => ({
    Reorder: {
        Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        Item: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    },
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
    ChevronDown: () => <div data-testid="icon-chevron-down" />,
    CheckCircle2: () => <div data-testid="icon-check-circle" />,
    Circle: () => <div data-testid="icon-circle" />,
    Archive: () => <div data-testid="icon-archive" />,
    Trash2: () => <div data-testid="icon-trash" />,
    ArrowRight: () => <div data-testid="icon-arrow-right" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    Copy: () => <div data-testid="icon-copy" />,
    Edit: () => <div data-testid="icon-edit" />,
    Play: () => <div data-testid="icon-play" />,
    Pause: () => <div data-testid="icon-pause" />,
    GripVertical: () => <div data-testid="icon-grip" />,
    ListTodo: () => <div data-testid="icon-list-todo" />,
    CalendarDays: () => <div data-testid="icon-calendar-days" />,
}));

describe("TaskList", () => {
    const mockTasks: Task[] = [
        {
            id: "1",
            title: "Task 1",
            type: "daily",
            createdAt: Date.now(),
            completed: false,
            order: 1,
        },
        {
            id: "2",
            title: "Task 2",
            type: "backlog",
            createdAt: Date.now(),
            completed: true,
            order: 2,
        },
    ];

    const mockState = {
        tasks: mockTasks,
        milestones: [],
        pomodoro: { activeTaskIds: [] },
        updateTask: jest.fn(),
        updateTaskOrder: jest.fn(),
        removeTask: jest.fn(),
        addActiveTask: jest.fn(),
        removeActiveTask: jest.fn(),
        completeTasks: jest.fn(),
        resetDailyDoneForToday: jest.fn(),
        archiveDailyTasks: jest.fn(),
    };

    beforeEach(() => {
        (useAppStore as unknown as jest.Mock).mockImplementation((selector) => {
            return selector(mockState);
        });
        // Mock getState for non-hook usage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useAppStore as any).getState = () => ({
            tasks: mockTasks,
        });
    });

    it("renders the task list title", () => {
        render(<TaskList title="My Tasks" tasks={mockTasks} />);
        expect(screen.getByText("My Tasks")).toBeInTheDocument();
    });

    it("renders tasks", () => {
        render(<TaskList title="My Tasks" tasks={mockTasks} />);
        expect(screen.getByText("Task 1")).toBeInTheDocument();
        expect(screen.getByText("Task 2")).toBeInTheDocument();
    });

    it("filters tasks by type", () => {
        render(<TaskList title="Daily Tasks" tasks={mockTasks} filterType="daily" />);
        expect(screen.getByText("Task 1")).toBeInTheDocument();
        expect(screen.queryByText("Task 2")).not.toBeInTheDocument();
    });

    it("filters tasks by status", () => {
        render(<TaskList title="Completed Tasks" tasks={mockTasks} filterStatus="completed" />);
        expect(screen.queryByText("Task 1")).not.toBeInTheDocument();
        expect(screen.getByText("Task 2")).toBeInTheDocument();
    });
});
