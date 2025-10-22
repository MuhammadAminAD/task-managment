import { Request, Response } from "express";
import fs from "fs"
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class IconController {
    async getAll(req: Request, res: Response) {
        const { search = "", limit = "50", skip = "0" } = req.query as {
            search?: string;
            limit?: string;
            skip?: string;
        };

        try {
            const iconsPath = path.join(__dirname, "..", "..", "..", "public", "icons");

            const iconsFolder = fs.readdirSync(iconsPath, { withFileTypes: true })
                .filter((dirent) => dirent.isDirectory())
                .filter((dirent) => !search || dirent.name.toLowerCase().includes(search.toLowerCase()))
                .map((dirent) => dirent.name);

            const allIcons = iconsFolder.flatMap((folderName) => {
                const folderPath = path.join(iconsPath, folderName);
                const files = fs.readdirSync(folderPath).filter((file) => file.endsWith(".svg"));

                return files.map((file) => ({
                    name: folderName,
                    type: file.replace(".svg", "").replace(`${folderName}-`, ""),
                    url: `/icons/${folderName}/${file}`,
                }));
            });

            const start = Number(skip);
            const end = start + Number(limit);

            const paginated = allIcons.slice(start, end);

            return res.status(200).json({
                ok: true,
                count: allIcons.length,
                data: paginated,
                hasMore: end < allIcons.length,
            });
        } catch (error) {
            console.error("❌ Error reading icons:", error);
            res.status(500).json({
                ok: false,
                error_message: "Failed to load icons",
            });
        }
    }

}