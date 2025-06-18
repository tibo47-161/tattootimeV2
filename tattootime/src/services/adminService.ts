import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export interface AdminRoleData {
  email: string;
}

export interface AdminRoleResponse {
  message: string;
}

export class AdminService {
  /**
   * Gibt einem Benutzer Admin-Rechte
   * @param email - Die E-Mail-Adresse des Benutzers, der Admin-Rechte erhalten soll
   * @returns Promise mit der Bestätigungsnachricht
   */
  static async addAdminRole(email: string): Promise<AdminRoleResponse> {
    try {
      const addAdminRoleFunction = httpsCallable<AdminRoleData, AdminRoleResponse>(
        functions,
        "addAdminRole"
      );
      
      const result = await addAdminRoleFunction({ email });
      return result.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Fehler beim Hinzufügen der Admin-Rolle";
      console.error("Fehler beim Hinzufügen der Admin-Rolle:", errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Entfernt Admin-Rechte von einem Benutzer
   * @param email - Die E-Mail-Adresse des Benutzers, dessen Admin-Rechte entfernt werden sollen
   * @returns Promise mit der Bestätigungsnachricht
   */
  static async removeAdminRole(email: string): Promise<AdminRoleResponse> {
    try {
      const removeAdminRoleFunction = httpsCallable<AdminRoleData, AdminRoleResponse>(
        functions,
        "removeAdminRole"
      );
      
      const result = await removeAdminRoleFunction({ email });
      return result.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Fehler beim Entfernen der Admin-Rolle";
      console.error("Fehler beim Entfernen der Admin-Rolle:", errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Prüft, ob der aktuelle Benutzer Admin-Rechte hat
   * @param user - Der aktuelle Benutzer
   * @returns true, wenn der Benutzer Admin-Rechte hat, sonst false
   */
  static isAdmin(user: unknown): boolean {
    // user should be an object with a token property or a role property
    if (typeof user === "object" && user !== null) {
      // @ts-expect-error: dynamic access
      if (user.token?.admin === true) return true;
      // @ts-expect-error: dynamic access
      if (user.role === "admin") return true;
    }
    return false;
  }
} 