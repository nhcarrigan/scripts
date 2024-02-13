export interface CrowdinStringsResponse {
  data: {
    data: {
      id: number;
      projectId: number;
      branchId: number;
      identifier: string;
      text: string;
      type: string;
      context: string;
      maxLength: number;
      isHidden: boolean;
      isDuplicate: boolean;
      masterStringId: number;
      hasPlurals: boolean;
      isIcu: boolean;
      labelIds: number[];
      createdAt: string;
      updatedAt: string;
      fileId: number;
      directoryId: number;
      revision: number;
    };
  }[];
  pagination: {
    offset: number;
    limit: number;
  };
}
