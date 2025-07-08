import axios from "axios";

class ImageEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
    this.getToken = sdk.getToken.bind(sdk);
  }

  async getImage(id, params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Image/${id}.json`,
      method: "GET",
      params: params || {},
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET IMAGE ERROR", error, false);
      return [];
    }
  }

  // Get images
  async getImages(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Image.json`,
      method: "GET",
      params: params || {},
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET IMAGES ERROR", error, false);
      return [];
    }
  }

  // Post an image
  async postImage(imageFilePath, metadata) {
    if (!imageFilePath)
      return this.handleError("You need to provide an image file path");
    if (!metadata || (!metadata.itemID && !metadata.itemMatrixID)) {
      return this.handleError(
        "You need to provide metadata with either itemID or itemMatrixID"
      );
    }

    // Import required modules dynamically
    const FormData = (await import("form-data")).default;
    const fs = (await import("fs")).default;
    const path = (await import("path")).default;

    // Create form data object
    const formData = new FormData();

    // Add the metadata as JSON string to the 'data' field
    formData.append("data", JSON.stringify(metadata));

    // Get filename from path
    const filename = path.basename(imageFilePath);

    // Add the image file to the form
    formData.append("image", fs.createReadStream(imageFilePath), {
      filename,
      contentType: this.getContentType(filename),
    });

    const token = await this.getToken();
    if (!token) throw new Error("Error Fetching Token");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Image.json`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders(),
      },
      data: formData,
    };

    try {
      const response = await axios(options);
      return response.data;
    } catch (error) {
      return this.handleError("POST IMAGE ERROR", error);
    }
  }

  // Helper to get content type from filename
  getContentType(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      default:
        return "application/octet-stream";
    }
  }
}

export default ImageEndpoint;
