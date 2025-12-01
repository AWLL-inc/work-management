import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportWorkLogsToCsv, type WorkLogCsvRow } from "../csv-export";

describe("csv-export", () => {
  let mockCreateElement: ReturnType<typeof vi.fn>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;
  let mockAppendChild: ReturnType<typeof vi.fn>;
  let mockRemoveChild: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    mockClick = vi.fn();
    mockAppendChild = vi.fn();
    mockRemoveChild = vi.fn();
    mockCreateObjectURL = vi.fn(() => "blob:mock-url");
    mockRevokeObjectURL = vi.fn();

    // Mock DOM APIs
    mockCreateElement = vi.fn(() => ({
      href: "",
      download: "",
      click: mockClick,
    }));

    global.document = {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as unknown as Document;

    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    global.Blob = vi.fn() as unknown as typeof Blob;
  });

  describe("exportWorkLogsToCsv", () => {
    it("should export basic work logs to CSV", () => {
      const workLogs: WorkLogCsvRow[] = [
        {
          date: new Date("2024-01-01"),
          user: "田中太郎",
          hours: "8.0",
          project: "プロジェクトA",
          category: "開発",
          details: "機能実装",
        },
      ];

      exportWorkLogsToCsv(workLogs, "test.csv");

      // Verify Blob was created with correct content
      expect(global.Blob).toHaveBeenCalledWith(
        [
          expect.stringContaining(
            "日付,ユーザー,工数,プロジェクト,カテゴリ,詳細",
          ),
        ],
        { type: "text/csv;charset=utf-8;" },
      );

      // Verify the CSV content includes BOM and data
      const blobContent = (global.Blob as unknown as ReturnType<typeof vi.fn>)
        .mock.calls[0][0][0];
      expect(blobContent).toContain("\uFEFF"); // BOM
      expect(blobContent).toContain(
        "2024-01-01,田中太郎,8.0,プロジェクトA,開発,機能実装",
      );

      // Verify download was triggered
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should escape commas in values", () => {
      const workLogs: WorkLogCsvRow[] = [
        {
          date: new Date("2024-01-01"),
          user: "田中太郎",
          hours: "8.0",
          project: "プロジェクトA",
          category: "開発",
          details: "機能A, 機能B, 機能C",
        },
      ];

      exportWorkLogsToCsv(workLogs);

      const blobContent = (global.Blob as unknown as ReturnType<typeof vi.fn>)
        .mock.calls[0][0][0];
      expect(blobContent).toContain('"機能A, 機能B, 機能C"');
    });

    it("should escape quotes in values", () => {
      const workLogs: WorkLogCsvRow[] = [
        {
          date: new Date("2024-01-01"),
          user: "田中太郎",
          hours: "8.0",
          project: "プロジェクトA",
          category: "開発",
          details: '彼は"すごい"と言った',
        },
      ];

      exportWorkLogsToCsv(workLogs);

      const blobContent = (global.Blob as unknown as ReturnType<typeof vi.fn>)
        .mock.calls[0][0][0];
      expect(blobContent).toContain('"彼は""すごい""と言った"');
    });

    it("should escape newlines in values", () => {
      const workLogs: WorkLogCsvRow[] = [
        {
          date: new Date("2024-01-01"),
          user: "田中太郎",
          hours: "8.0",
          project: "プロジェクトA",
          category: "開発",
          details: "行1\n行2\n行3",
        },
      ];

      exportWorkLogsToCsv(workLogs);

      const blobContent = (global.Blob as unknown as ReturnType<typeof vi.fn>)
        .mock.calls[0][0][0];
      expect(blobContent).toContain('"行1\n行2\n行3"');
    });

    it("should handle null details", () => {
      const workLogs: WorkLogCsvRow[] = [
        {
          date: new Date("2024-01-01"),
          user: "田中太郎",
          hours: "8.0",
          project: "プロジェクトA",
          category: "開発",
          details: null,
        },
      ];

      exportWorkLogsToCsv(workLogs);

      const blobContent = (global.Blob as unknown as ReturnType<typeof vi.fn>)
        .mock.calls[0][0][0];
      // Null should be converted to empty string, so the line should end with nothing after the last comma
      expect(blobContent).toMatch(
        /2024-01-01,田中太郎,8\.0,プロジェクトA,開発,\s*$/m,
      );
    });

    it("should handle string dates", () => {
      const workLogs: WorkLogCsvRow[] = [
        {
          date: "2024-01-01T10:30:00Z",
          user: "田中太郎",
          hours: "8.0",
          project: "プロジェクトA",
          category: "開発",
          details: "機能実装",
        },
      ];

      exportWorkLogsToCsv(workLogs);

      const blobContent = (global.Blob as unknown as ReturnType<typeof vi.fn>)
        .mock.calls[0][0][0];
      expect(blobContent).toContain("2024-01-01,田中太郎");
    });

    it("should export multiple work logs", () => {
      const workLogs: WorkLogCsvRow[] = [
        {
          date: new Date("2024-01-01"),
          user: "田中太郎",
          hours: "8.0",
          project: "プロジェクトA",
          category: "開発",
          details: "機能実装",
        },
        {
          date: new Date("2024-01-02"),
          user: "鈴木花子",
          hours: "6.5",
          project: "プロジェクトB",
          category: "テスト",
          details: "テスト実施",
        },
        {
          date: new Date("2024-01-03"),
          user: "佐藤次郎",
          hours: "7.0",
          project: "プロジェクトC",
          category: "レビュー",
          details: "コードレビュー",
        },
      ];

      exportWorkLogsToCsv(workLogs);

      const blobContent = (global.Blob as unknown as ReturnType<typeof vi.fn>)
        .mock.calls[0][0][0];

      // Check header
      expect(blobContent).toContain(
        "日付,ユーザー,工数,プロジェクト,カテゴリ,詳細",
      );

      // Check all data rows
      expect(blobContent).toContain(
        "2024-01-01,田中太郎,8.0,プロジェクトA,開発,機能実装",
      );
      expect(blobContent).toContain(
        "2024-01-02,鈴木花子,6.5,プロジェクトB,テスト,テスト実施",
      );
      expect(blobContent).toContain(
        "2024-01-03,佐藤次郎,7.0,プロジェクトC,レビュー,コードレビュー",
      );
    });

    it("should use custom filename when provided", () => {
      const workLogs: WorkLogCsvRow[] = [
        {
          date: new Date("2024-01-01"),
          user: "田中太郎",
          hours: "8.0",
          project: "プロジェクトA",
          category: "開発",
          details: "機能実装",
        },
      ];

      exportWorkLogsToCsv(workLogs, "custom-filename.csv");

      const linkElement = mockCreateElement.mock.results[0].value;
      expect(linkElement.download).toBe("custom-filename.csv");
    });

    it("should generate default filename with current date when not provided", () => {
      const workLogs: WorkLogCsvRow[] = [
        {
          date: new Date("2024-01-01"),
          user: "田中太郎",
          hours: "8.0",
          project: "プロジェクトA",
          category: "開発",
          details: "機能実装",
        },
      ];

      exportWorkLogsToCsv(workLogs);

      const linkElement = mockCreateElement.mock.results[0].value;
      expect(linkElement.download).toMatch(
        /^work-logs-\d{4}-\d{2}-\d{2}\.csv$/,
      );
    });

    it("should handle empty work logs array", () => {
      const workLogs: WorkLogCsvRow[] = [];

      exportWorkLogsToCsv(workLogs);

      const blobContent = (global.Blob as unknown as ReturnType<typeof vi.fn>)
        .mock.calls[0][0][0];

      // Should only contain header
      expect(blobContent).toContain(
        "日付,ユーザー,工数,プロジェクト,カテゴリ,詳細",
      );

      // Should not contain any data rows (only header line + BOM)
      const lines = blobContent.split("\n");
      expect(lines.length).toBe(1); // Only header
    });

    it("should include BOM for Excel compatibility", () => {
      const workLogs: WorkLogCsvRow[] = [
        {
          date: new Date("2024-01-01"),
          user: "田中太郎",
          hours: "8.0",
          project: "プロジェクトA",
          category: "開発",
          details: "機能実装",
        },
      ];

      exportWorkLogsToCsv(workLogs);

      const blobContent = (global.Blob as unknown as ReturnType<typeof vi.fn>)
        .mock.calls[0][0][0];

      // Check that content starts with BOM
      expect(blobContent.charCodeAt(0)).toBe(0xfeff);
    });
  });
});
