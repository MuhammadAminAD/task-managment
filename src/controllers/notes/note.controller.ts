import { Request, Response } from "express";
import pool from "../../config/database.config.js";

export class NoteController {
    // 🟩 1. CREATE NOTE
    async createNote(req: Request, res: Response) {
        try {
            const { title, description, icon } = req.body;
            // @ts-ignore
            const UID = req.user?.id;

            if (!title) {
                return res.status(400).json({
                    ok: false,
                    error_message: '"Title" is required',
                });
            }

            const query = `
                INSERT INTO notes (title, logo, description, owner)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const values = [title, icon ?? "", description ?? "", UID];
            const result = await pool.query(query, values);

            return res.status(201).json({
                ok: true,
                message: "Note created successfully",
                note: result.rows[0],
            });
        } catch (error: any) {
            console.error("Error creating note:", error.message);
            return res.status(500).json({
                ok: false,
                message: "Server error",
                error: error.message,
            });
        }
    }

    // 🟩 2. CREATE SECTION
    async createSection(req: Request, res: Response) {
        try {
            const { title, heshteg, note_id } = req.body;

            if (!title || !note_id) {
                return res.status(400).json({
                    ok: false,
                    error_message: '"Title" and "note_id" are required',
                });
            }

            const insertSection = `
                INSERT INTO noteSections (title, heshteg, note_id)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            const sectionValues = [title, heshteg ?? "", note_id];
            const result = await pool.query(insertSection, sectionValues);

            const sectionId = result.rows[0].id;

            await pool.query(
                `UPDATE notes
                 SET sections = array_append(COALESCE(sections, '{}'), $1)
                 WHERE id = $2`,
                [sectionId, note_id]
            );

            return res.status(201).json({
                ok: true,
                message: "Note section created successfully",
                section: result.rows[0],
            });
        } catch (error: any) {
            console.error("Error creating section:", error.message);
            return res.status(500).json({
                ok: false,
                message: "Server error",
                error: error.message,
            });
        }
    }

    // 🟩 3. CREATE CONTENT
    async createContent(req: Request, res: Response) {
        try {
            const { type, title, value, section_id } = req.body;

            if (!type || !section_id) {
                return res.status(400).json({
                    ok: false,
                    error_message: '"type" and "section_id" are required',
                });
            }

            const insertContent = `
                INSERT INTO noteContents (title, type, value, section_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const values = [title ?? "", type, value ?? "", section_id];
            const result = await pool.query(insertContent, values);

            const contentId = result.rows[0].id;

            await pool.query(
                `UPDATE noteSections
                 SET contents = array_append(COALESCE(contents, '{}'), $1)
                 WHERE id = $2`,
                [contentId, section_id]
            );

            return res.status(201).json({
                ok: true,
                message: "Note content created successfully",
                content: result.rows[0],
            });
        } catch (error: any) {
            console.error("Error creating content:", error.message);
            return res.status(500).json({
                ok: false,
                message: "Server error",
                error: error.message,
            });
        }
    }

    // 🟩 4. GET ALL NOTES (userga tegishli)
    async getNote(req: Request, res: Response) {
        try {
            // @ts-ignore
            const UID = req.user?.id;
            const result = await pool.query(
                `SELECT * FROM notes WHERE owner = $1 ORDER BY id DESC`,
                [UID]
            );

            return res.status(200).json({
                ok: true,
                notes: result.rows,
            });
        } catch (error: any) {
            console.error("Error getting notes:", error.message);
            return res.status(500).json({
                ok: false,
                message: "Server error",
                error: error.message,
            });
        }
    }

    // 🟩 5. GET NOTE CONTENT — Frontend uchun moslashtirilgan
    async getNoteContent(req: Request, res: Response) {
        try {
            const { id: note_id } = req.params;
            if (!note_id) {
                return res.status(400).json({
                    ok: false,
                    error_message: '"note_id" is required',
                });
            }

            // Note ma'lumotini olish
            const noteQuery = `SELECT * FROM notes WHERE id = $1;`;
            const noteResult = await pool.query(noteQuery, [note_id]);

            if (!noteResult.rows.length) {
                return res.status(404).json({
                    ok: false,
                    message: "Note not found",
                });
            }

            // Sections va ularning contents'ini olish
            const sectionsQuery = `
                SELECT s.*, 
                    COALESCE(
                        json_agg(c.* ORDER BY c.id ASC) FILTER (WHERE c.id IS NOT NULL),
                        '[]'
                    ) AS contents
                FROM noteSections s
                LEFT JOIN noteContents c ON c.section_id = s.id
                WHERE s.note_id = $1
                GROUP BY s.id
                ORDER BY s.id ASC;
            `;
            const sectionsResult = await pool.query(sectionsQuery, [note_id]);

            // Frontend uchun formatlash
            const formattedSections = sectionsResult.rows.map(section => ({
                id: section.id,
                type: "section",
                title: section.title,
                heshteg: section.heshteg,
                children: section.contents.map((content: any) => ({
                    id: content.id,
                    type: content.type,
                    title: content.title,
                    value: content.value,
                }))
            }));

            // Note obyektiga sections qo'shish
            const noteWithSections = {
                ...noteResult.rows[0],
                sections: formattedSections
            };

            return res.status(200).json({
                ok: true,
                note: noteWithSections,
            });
        } catch (error: any) {
            console.error("Error getting note content:", error.message);
            return res.status(500).json({
                ok: false,
                message: "Server error",
                error: error.message,
            });
        }
    }

    // 🟩 6. PUT NOTE (Frontend formatidan kelgan ma'lumotni qayta ishlash)
    async putNote(req: Request, res: Response) {
        const client = await pool.connect();
        try {
            const { id, title, description, logo, sections } = req.body;

            await client.query("BEGIN");

            // 🟩 1. Note yangilash
            await client.query(
                `UPDATE notes SET title=$1, description=$2, logo=$3 WHERE id=$4`,
                [title, description, logo ?? "", id]
            );

            // 🟩 2. Eski section va contentlarni olish
            const oldSectionsRes = await client.query(
                `SELECT id, contents FROM noteSections WHERE note_id=$1`,
                [id]
            );
            const oldSections = oldSectionsRes.rows;

            const newSectionIds: number[] = [];

            // 🟩 3. Har bir yangi sectionni tekshirish
            for (const section of sections) {
                let sectionId = section.id;

                if (sectionId && typeof sectionId === 'number') {
                    // mavjud bo'lsa → UPDATE
                    await client.query(
                        `UPDATE noteSections SET title=$1, heshteg=$2 WHERE id=$3`,
                        [section.title, section.heshteg ?? "", sectionId]
                    );
                } else {
                    // yangi bo'lsa → INSERT
                    const secRes = await client.query(
                        `INSERT INTO noteSections (title, heshteg, note_id)
                         VALUES ($1, $2, $3)
                         RETURNING id`,
                        [section.title, section.heshteg ?? "", id]
                    );
                    sectionId = secRes.rows[0].id;
                }

                newSectionIds.push(sectionId);

                // 🟩 contentlar bilan ishlash (children → contents)
                const oldContents =
                    oldSections.find((s) => s.id === sectionId)?.contents || [];

                const newContentIds: number[] = [];
                const children = section.children || section.contents || [];

                for (const content of children) {
                    let contentId = content.id;

                    if (contentId && typeof contentId === 'number') {
                        // mavjud bo'lsa → UPDATE
                        await client.query(
                            `UPDATE noteContents SET title=$1, type=$2, value=$3 WHERE id=$4`,
                            [content.title ?? "", content.type, content.value ?? "", contentId]
                        );
                    } else {
                        // yangi bo'lsa → INSERT
                        const contRes = await client.query(
                            `INSERT INTO noteContents (title, type, value, section_id)
                             VALUES ($1, $2, $3, $4)
                             RETURNING id`,
                            [content.title ?? "", content.type, content.value ?? "", sectionId]
                        );
                        contentId = contRes.rows[0].id;
                    }

                    newContentIds.push(contentId);
                }

                // 🟥 Eski contentlardan o'chganlarini DELETE qilish
                for (const oldId of oldContents) {
                    if (!newContentIds.includes(oldId)) {
                        await client.query(
                            `DELETE FROM noteContents WHERE id=$1`,
                            [oldId]
                        );
                    }
                }

                // 🟩 Section contents arrayini yangilash
                await client.query(
                    `UPDATE noteSections SET contents=$1 WHERE id=$2`,
                    [newContentIds, sectionId]
                );
            }

            // 🟥 O'chgan sectionlarni DELETE qilish
            for (const old of oldSections) {
                if (!newSectionIds.includes(old.id)) {
                    await client.query(`DELETE FROM noteSections WHERE id=$1`, [old.id]);
                }
            }

            // 🟩 Notes.sections arrayini yangilash
            await client.query(`UPDATE notes SET sections=$1 WHERE id=$2`, [
                newSectionIds,
                id,
            ]);

            await client.query("COMMIT");

            return res.status(200).json({
                ok: true,
                message: "Note updated successfully",
            });
        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("Error updating note:", error.message);
            return res.status(500).json({
                ok: false,
                message: "Server error",
                error: error.message,
            });
        } finally {
            client.release();
        }
    }

    // 🔴 DELETE NOTE
    async deleteNote(req: Request, res: Response) {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            // @ts-ignore
            const UID = req.user?.id;

            await client.query("BEGIN");

            // Avval note mavjudligini va ownerligini tekshirish
            const noteCheck = await client.query(
                `SELECT id FROM notes WHERE id=$1 AND owner=$2`,
                [id, UID]
            );

            if (!noteCheck.rows.length) {
                await client.query("ROLLBACK");
                return res.status(404).json({
                    ok: false,
                    message: "Note not found or access denied",
                });
            }

            // Sections va contents o'chirish (CASCADE bo'lsa kerak emas)
            await client.query(
                `DELETE FROM noteContents 
                 WHERE section_id IN (
                    SELECT id FROM noteSections WHERE note_id=$1
                 )`,
                [id]
            );

            await client.query(
                `DELETE FROM noteSections WHERE note_id=$1`,
                [id]
            );

            await client.query(
                `DELETE FROM notes WHERE id=$1`,
                [id]
            );

            await client.query("COMMIT");

            return res.status(200).json({
                ok: true,
                message: "Note deleted successfully",
            });
        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("Error deleting note:", error.message);
            return res.status(500).json({
                ok: false,
                message: "Server error",
                error: error.message,
            });
        } finally {
            client.release();
        }
    }
}