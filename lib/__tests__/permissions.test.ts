import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  canEditTeamMemberWorkLog,
  canEditWorkLog,
  canManageTeamMembers,
  canViewWorkLog,
  checkIfTeammates,
} from "../permissions";

/**
 * Unit tests for Permission Logic
 * Tests checkIfTeammates, canViewWorkLog, and canEditWorkLog functions
 */

// Mock database connection
vi.mock("@/lib/db/connection", () => {
  return {
    db: {
      select: vi.fn(),
      from: vi.fn(),
      innerJoin: vi.fn(),
      where: vi.fn(),
      limit: vi.fn(),
    },
  };
});

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual("drizzle-orm");
  return {
    ...actual,
    eq: vi.fn((field, value) => ({ field, value, op: "eq" })),
    and: vi.fn((...conditions) => ({ conditions, op: "and" })),
  };
});

vi.mock("drizzle-orm/pg-core", async () => {
  const actual = await vi.importActual("drizzle-orm/pg-core");
  return {
    ...actual,
    alias: vi.fn((table, name) => ({ ...table, _alias: name })),
  };
});

import { db } from "@/lib/db/connection";

describe("Permission Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkIfTeammates", () => {
    it("should return true if both users are the same", async () => {
      const userId = "user-1";
      const result = await checkIfTeammates(userId, userId);

      expect(result).toBe(true);
      // Should not query database for same user
      expect(vi.mocked(db.select)).not.toHaveBeenCalled();
    });

    it("should return true if users share a common team", async () => {
      const userId1 = "user-1";
      const userId2 = "user-2";

      // Mock database returning common team
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ teamId: "team-1" }]), // Found common team
            }),
          }),
        }),
      } as any);

      const result = await checkIfTeammates(userId1, userId2);

      expect(result).toBe(true);
      expect(vi.mocked(db.select)).toHaveBeenCalled();
    });

    it("should return false if users do not share a common team", async () => {
      const userId1 = "user-1";
      const userId2 = "user-2";

      // Mock database returning no common teams
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // No common teams
            }),
          }),
        }),
      } as any);

      const result = await checkIfTeammates(userId1, userId2);

      expect(result).toBe(false);
      expect(vi.mocked(db.select)).toHaveBeenCalled();
    });
  });

  describe("canViewWorkLog", () => {
    it("should return true for admin users", async () => {
      const viewerUserId = "admin-id";
      const targetUserId = "other-user-id";
      const viewerRole = "admin";

      const result = await canViewWorkLog(
        viewerUserId,
        targetUserId,
        viewerRole,
      );

      expect(result).toBe(true);
      // Should not query database for admin
      expect(vi.mocked(db.select)).not.toHaveBeenCalled();
    });

    it("should return true when viewing own work log", async () => {
      const userId = "user-1";
      const viewerRole = "user";

      const result = await canViewWorkLog(userId, userId, viewerRole);

      expect(result).toBe(true);
      // Should not query database for own work log
      expect(vi.mocked(db.select)).not.toHaveBeenCalled();
    });

    it("should return true when viewing teammate work log", async () => {
      const viewerUserId = "user-1";
      const targetUserId = "user-2";
      const viewerRole = "user";

      // Mock users are teammates
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ teamId: "team-1" }]),
            }),
          }),
        }),
      } as any);

      const result = await canViewWorkLog(
        viewerUserId,
        targetUserId,
        viewerRole,
      );

      expect(result).toBe(true);
      expect(vi.mocked(db.select)).toHaveBeenCalled();
    });

    it("should return false when viewing non-teammate work log", async () => {
      const viewerUserId = "user-1";
      const targetUserId = "user-2";
      const viewerRole = "user";

      // Mock users are not teammates
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // No common teams
            }),
          }),
        }),
      } as any);

      const result = await canViewWorkLog(
        viewerUserId,
        targetUserId,
        viewerRole,
      );

      expect(result).toBe(false);
      expect(vi.mocked(db.select)).toHaveBeenCalled();
    });

    it("should return true for manager viewing own work log", async () => {
      const userId = "manager-1";
      const viewerRole = "manager";

      const result = await canViewWorkLog(userId, userId, viewerRole);

      expect(result).toBe(true);
    });
  });

  describe("canEditWorkLog", () => {
    it("should return true for admin users", async () => {
      const editorUserId = "admin-id";
      const targetUserId = "other-user-id";
      const editorRole = "admin";

      const result = await canEditWorkLog(
        editorUserId,
        targetUserId,
        editorRole,
      );

      expect(result).toBe(true);
    });

    it("should return true when editing own work log", async () => {
      const userId = "user-1";
      const editorRole = "user";

      const result = await canEditWorkLog(userId, userId, editorRole);

      expect(result).toBe(true);
    });

    it("should return false when non-admin tries to edit other user work log", async () => {
      const editorUserId = "user-1";
      const targetUserId = "user-2";
      const editorRole = "user";

      const result = await canEditWorkLog(
        editorUserId,
        targetUserId,
        editorRole,
      );

      expect(result).toBe(false);
    });

    it("should return false when manager tries to edit other user work log", async () => {
      const editorUserId = "manager-1";
      const targetUserId = "user-1";
      const editorRole = "manager";

      const result = await canEditWorkLog(
        editorUserId,
        targetUserId,
        editorRole,
      );

      expect(result).toBe(false);
    });

    it("should return true for manager editing own work log", async () => {
      const userId = "manager-1";
      const editorRole = "manager";

      const result = await canEditWorkLog(userId, userId, editorRole);

      expect(result).toBe(true);
    });

    it("should enforce edit restrictions even for teammates", async () => {
      // Even if users are teammates, non-admin cannot edit
      const editorUserId = "user-1";
      const targetUserId = "user-2";
      const editorRole = "user";

      const result = await canEditWorkLog(
        editorUserId,
        targetUserId,
        editorRole,
      );

      expect(result).toBe(false);
      // Edit permission does not check team membership
    });
  });

  describe("Permission Rules Summary", () => {
    it("should enforce: Admins can view and edit all", async () => {
      const adminId = "admin-1";
      const targetId = "user-1";
      const adminRole = "admin";

      const canView = await canViewWorkLog(adminId, targetId, adminRole);
      const canEdit = await canEditWorkLog(adminId, targetId, adminRole);

      expect(canView).toBe(true);
      expect(canEdit).toBe(true);
    });

    it("should enforce: Users can view teammates but not edit", async () => {
      const userId = "user-1";
      const teammateId = "user-2";
      const userRole = "user";

      // Mock as teammates
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ teamId: "team-1" }]),
            }),
          }),
        }),
      } as any);

      const canView = await canViewWorkLog(userId, teammateId, userRole);
      const canEdit = await canEditWorkLog(userId, teammateId, userRole);

      expect(canView).toBe(true);
      expect(canEdit).toBe(false);
    });

    it("should enforce: Users can view and edit own work logs", async () => {
      const userId = "user-1";
      const userRole = "user";

      const canView = await canViewWorkLog(userId, userId, userRole);
      const canEdit = await canEditWorkLog(userId, userId, userRole);

      expect(canView).toBe(true);
      expect(canEdit).toBe(true);
    });

    it("should enforce: Non-teammates cannot view or edit", async () => {
      const userId = "user-1";
      const otherId = "user-2";
      const userRole = "user";

      // Mock as non-teammates
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // No common teams
            }),
          }),
        }),
      } as any);

      const canView = await canViewWorkLog(userId, otherId, userRole);
      const canEdit = await canEditWorkLog(userId, otherId, userRole);

      expect(canView).toBe(false);
      expect(canEdit).toBe(false);
    });
  });

  describe("Team Leader Permissions", () => {
    describe("canEditTeamMemberWorkLog", () => {
      it("should allow admin to edit any work log", () => {
        const editorId = "admin-1";
        const targetId = "user-1";
        const editorRole = "admin";
        const teamRole = null;
        const isSameTeam = false;

        const result = canEditTeamMemberWorkLog(
          editorId,
          targetId,
          editorRole,
          teamRole,
          isSameTeam,
        );

        expect(result).toBe(true);
      });

      it("should allow user to edit their own work log", () => {
        const userId = "user-1";
        const editorRole = "user";
        const teamRole = "member";
        const isSameTeam = true;

        const result = canEditTeamMemberWorkLog(
          userId,
          userId,
          editorRole,
          teamRole,
          isSameTeam,
        );

        expect(result).toBe(true);
      });

      it("should allow team leader to edit same team member work log", () => {
        const leaderId = "leader-1";
        const memberId = "member-1";
        const editorRole = "user";
        const teamRole = "leader";
        const isSameTeam = true;

        const result = canEditTeamMemberWorkLog(
          leaderId,
          memberId,
          editorRole,
          teamRole,
          isSameTeam,
        );

        expect(result).toBe(true);
      });

      it("should deny team leader editing non-team member work log", () => {
        const leaderId = "leader-1";
        const otherId = "user-1";
        const editorRole = "user";
        const teamRole = "leader";
        const isSameTeam = false;

        const result = canEditTeamMemberWorkLog(
          leaderId,
          otherId,
          editorRole,
          teamRole,
          isSameTeam,
        );

        expect(result).toBe(false);
      });

      it("should deny viewer editing their own work log", () => {
        const viewerId = "viewer-1";
        const editorRole = "user";
        const teamRole = "viewer";
        const isSameTeam = true;

        const result = canEditTeamMemberWorkLog(
          viewerId,
          viewerId,
          editorRole,
          teamRole,
          isSameTeam,
        );

        expect(result).toBe(false);
      });

      it("should deny member editing other member work log", () => {
        const memberId = "member-1";
        const otherMemberId = "member-2";
        const editorRole = "user";
        const teamRole = "member";
        const isSameTeam = true;

        const result = canEditTeamMemberWorkLog(
          memberId,
          otherMemberId,
          editorRole,
          teamRole,
          isSameTeam,
        );

        expect(result).toBe(false);
      });
    });

    describe("canManageTeamMembers", () => {
      it("should allow admin to manage team members", () => {
        const result = canManageTeamMembers("admin", null);
        expect(result).toBe(true);
      });

      it("should allow team leader to manage team members", () => {
        const result = canManageTeamMembers("user", "leader");
        expect(result).toBe(true);
      });

      it("should deny regular member from managing team members", () => {
        const result = canManageTeamMembers("user", "member");
        expect(result).toBe(false);
      });

      it("should deny viewer from managing team members", () => {
        const result = canManageTeamMembers("user", "viewer");
        expect(result).toBe(false);
      });

      it("should deny manager without team leader role from managing team members", () => {
        const result = canManageTeamMembers("manager", "member");
        expect(result).toBe(false);
      });
    });
  });
});
