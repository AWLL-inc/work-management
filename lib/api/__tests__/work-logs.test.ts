import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getWorkLogs,
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
  type CreateWorkLogData,
  type UpdateWorkLogData,
  type GetWorkLogsOptions,
} from "../work-logs";
import * as utils from "../utils";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the utils module with proper factory function
vi.mock("../utils", () => ({
  handleApiResponse: vi.fn(),
  handleApiResponseNoData: vi.fn(),
}));

describe("lib/api/work-logs", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getWorkLogs", () => {
    const mockWorkLogs = [
      {
        id: "1",
        date: new Date("2024-10-01"),
        hours: "8.0",
        projectId: "proj-1",
        categoryId: "cat-1",
        details: "Development work",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        date: new Date("2024-10-02"),
        hours: "6.5",
        projectId: "proj-2",
        categoryId: "cat-2",
        details: null,
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("should fetch work logs without options", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLogs);

      const result = await getWorkLogs();

      expect(mockFetch).toHaveBeenCalledWith("/api/work-logs");
      expect(utils.handleApiResponse).toHaveBeenCalledWith(
        mockResponse,
        "Failed to fetch work logs"
      );
      expect(result).toEqual(mockWorkLogs);
    });

    it("should fetch work logs with single option", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLogs);

      const options: GetWorkLogsOptions = {
        startDate: "2024-10-01",
      };

      const result = await getWorkLogs(options);

      expect(mockFetch).toHaveBeenCalledWith("/api/work-logs?startDate=2024-10-01");
      expect(utils.handleApiResponse).toHaveBeenCalledWith(
        mockResponse,
        "Failed to fetch work logs"
      );
      expect(result).toEqual(mockWorkLogs);
    });

    it("should fetch work logs with all options", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLogs);

      const options: GetWorkLogsOptions = {
        startDate: "2024-10-01",
        endDate: "2024-10-31",
        projectIds: "proj-1,proj-2",
        categoryIds: "cat-1,cat-2",
        userId: "user-1",
        page: 1,
        limit: 20,
        searchText: "development",
      };

      const result = await getWorkLogs(options);

      const expectedUrl = "/api/work-logs?startDate=2024-10-01&endDate=2024-10-31&projectIds=proj-1%2Cproj-2&categoryIds=cat-1%2Ccat-2&userId=user-1&page=1&limit=20&searchText=development";
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      expect(utils.handleApiResponse).toHaveBeenCalledWith(
        mockResponse,
        "Failed to fetch work logs"
      );
      expect(result).toEqual(mockWorkLogs);
    });

    it("should fetch work logs with partial options", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLogs);

      const options: GetWorkLogsOptions = {
        projectIds: "proj-1",
        page: 2,
        limit: 10,
      };

      const result = await getWorkLogs(options);

      expect(mockFetch).toHaveBeenCalledWith("/api/work-logs?projectIds=proj-1&page=2&limit=10");
      expect(utils.handleApiResponse).toHaveBeenCalledWith(
        mockResponse,
        "Failed to fetch work logs"
      );
      expect(result).toEqual(mockWorkLogs);
    });

    it("should handle empty options object", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLogs);

      const result = await getWorkLogs({});

      expect(mockFetch).toHaveBeenCalledWith("/api/work-logs");
      expect(utils.handleApiResponse).toHaveBeenCalledWith(
        mockResponse,
        "Failed to fetch work logs"
      );
      expect(result).toEqual(mockWorkLogs);
    });

    it("should skip falsy and empty options", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLogs);

      const options: GetWorkLogsOptions = {
        startDate: "2024-10-01",
        endDate: undefined,
        projectIds: "", // Empty string is falsy, should be skipped
        page: 0, // 0 is falsy, should be skipped
        limit: 10, // Non-zero number should be included
      };

      const result = await getWorkLogs(options);

      expect(mockFetch).toHaveBeenCalledWith("/api/work-logs?startDate=2024-10-01&limit=10");
      expect(result).toEqual(mockWorkLogs);
    });
  });

  describe("createWorkLog", () => {
    const mockWorkLog = {
      id: "1",
      date: new Date("2024-10-01"),
      hours: "8.0",
      projectId: "proj-1",
      categoryId: "cat-1",
      details: "New work log",
      userId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createData: CreateWorkLogData = {
      date: "2024-10-01",
      hours: "8.0",
      projectId: "proj-1",
      categoryId: "cat-1",
      details: "New work log",
    };

    it("should create work log successfully", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLog);

      const result = await createWorkLog(createData);

      expect(mockFetch).toHaveBeenCalledWith("/api/work-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createData),
      });
      expect(utils.handleApiResponse).toHaveBeenCalledWith(
        mockResponse,
        "Failed to create work log"
      );
      expect(result).toEqual(mockWorkLog);
    });

    it("should create work log with Date object", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLog);

      const createDataWithDate: CreateWorkLogData = {
        ...createData,
        date: new Date("2024-10-01"),
      };

      const result = await createWorkLog(createDataWithDate);

      expect(mockFetch).toHaveBeenCalledWith("/api/work-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createDataWithDate),
      });
      expect(result).toEqual(mockWorkLog);
    });

    it("should create work log without details", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLog);

      const createDataMinimal: CreateWorkLogData = {
        date: "2024-10-01",
        hours: "8.0",
        projectId: "proj-1",
        categoryId: "cat-1",
      };

      const result = await createWorkLog(createDataMinimal);

      expect(mockFetch).toHaveBeenCalledWith("/api/work-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createDataMinimal),
      });
      expect(result).toEqual(mockWorkLog);
    });
  });

  describe("updateWorkLog", () => {
    const workLogId = "1";
    const mockWorkLog = {
      id: workLogId,
      date: new Date("2024-10-02"),
      hours: "7.5",
      projectId: "proj-2",
      categoryId: "cat-2",
      details: "Updated work log",
      userId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updateData: UpdateWorkLogData = {
      date: "2024-10-02",
      hours: "7.5",
      projectId: "proj-2",
      categoryId: "cat-2",
      details: "Updated work log",
    };

    it("should update work log successfully", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLog);

      const result = await updateWorkLog(workLogId, updateData);

      expect(mockFetch).toHaveBeenCalledWith(`/api/work-logs/${workLogId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      expect(utils.handleApiResponse).toHaveBeenCalledWith(
        mockResponse,
        "Failed to update work log"
      );
      expect(result).toEqual(mockWorkLog);
    });

    it("should update work log with partial data", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLog);

      const partialUpdateData: UpdateWorkLogData = {
        hours: "7.5",
        details: "Updated details only",
      };

      const result = await updateWorkLog(workLogId, partialUpdateData);

      expect(mockFetch).toHaveBeenCalledWith(`/api/work-logs/${workLogId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(partialUpdateData),
      });
      expect(result).toEqual(mockWorkLog);
    });

    it("should update work log with Date object", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLog);

      const updateDataWithDate: UpdateWorkLogData = {
        ...updateData,
        date: new Date("2024-10-02"),
      };

      const result = await updateWorkLog(workLogId, updateDataWithDate);

      expect(mockFetch).toHaveBeenCalledWith(`/api/work-logs/${workLogId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateDataWithDate),
      });
      expect(result).toEqual(mockWorkLog);
    });

    it("should update work log with null details", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponse).mockResolvedValue(mockWorkLog);

      const updateDataWithNull: UpdateWorkLogData = {
        details: null,
      };

      const result = await updateWorkLog(workLogId, updateDataWithNull);

      expect(mockFetch).toHaveBeenCalledWith(`/api/work-logs/${workLogId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateDataWithNull),
      });
      expect(result).toEqual(mockWorkLog);
    });
  });

  describe("deleteWorkLog", () => {
    const workLogId = "1";

    it("should delete work log successfully", async () => {
      const mockResponse = new Response();
      mockFetch.mockResolvedValue(mockResponse);
      vi.mocked(utils.handleApiResponseNoData).mockResolvedValue(undefined);

      await deleteWorkLog(workLogId);

      expect(mockFetch).toHaveBeenCalledWith(`/api/work-logs/${workLogId}`, {
        method: "DELETE",
      });
      expect(utils.handleApiResponseNoData).toHaveBeenCalledWith(
        mockResponse,
        "Failed to delete work log"
      );
    });
  });
});