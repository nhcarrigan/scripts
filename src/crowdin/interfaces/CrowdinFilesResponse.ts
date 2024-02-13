export interface CrowdinFilesResponse {
  data: {
    id: number;
    projectId: number;
    branchId: null;
    directoryId: number;
    name: string;
    title: string;
    context: string;
    type: string;
    path: string;
    status: string;
    revisionId: number;
    priority: string;
    importOptions: {
      contentSegmentation: boolean;
      customSegmentation: boolean;
    };
    exportOptions: {
      exportPattern: string;
    };
    excludedTargetLanguages: string[];
    parserVersion: number;
    createdAt: string;
    updatedAt: string;
  };
}
