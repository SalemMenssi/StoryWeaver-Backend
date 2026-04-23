const Chapter = require("../Model/Chapter.model");
const Project = require("../Model/Project.model");
const { successResponse, errorResponse } = require("../Utils/apiResponse");

/**
 * syncChapters: Called by project controller on save.
 * Extracts counts and populates the Chapter collection.
 * Now includes Bidirectional Linking (previousNodeId / nextNodeId).
 */
const syncChapters = async (projectId, nodes, edges = [], chapters = []) => {
  // 1. Calculate Counts for the Project
  const nodeCount = nodes.length;
  const sceneCount = nodes.filter(n => n.type === 'sceneNode').length;
  let choiceCount = 0;
  nodes.forEach(n => {
    if (n.data?.choices) choiceCount += n.data.choices.length;
  });

  // 2. Identify all chapter IDs from the frontend
  const chapterIds = chapters.map(c => c.id);
  
  // 3. Delete chapters no longer in the project
  await Chapter.deleteMany({ project: projectId, nodeId: { $nin: chapterIds } });
  
  // 4. Upsert each chapter with its associated scenes
  const upsertPromises = chapters.map(chapter => {
    const chapterNodes = nodes.filter(n => n.data?.chapterId === chapter.id);
    
    const scenes = chapterNodes.map(node => {
      const data = node.data || {};
      
      // Calculate Previous and Next Node Links
      // Previous: Find any edge where this node is the TARGET
      const incomingEdge = edges.find(e => e.target === node.id);
      const previousNodeId = incomingEdge ? incomingEdge.source : null;

      // Next: Find any edge where the SOURCE is this node AND it's a direct handle (not a choice)
      // If no direct next node, we check if there are choices (handled below)
      const outgoingEdge = edges.find(e => 
        e.source === node.id && 
        !e.sourceHandle?.startsWith("choice-") // Direct link from node handle
      );
      const nextNodeId = outgoingEdge ? outgoingEdge.target : null;

      // UNIVERSAL CHOICE LINKING
      const choices = (data.choices || []).map(choice => {
        const choiceHandleIdSource = `choice-source-${choice.id}`;
        const choiceHandleIdTarget = `choice-target-${choice.id}`;
        
        const sourceEdge = edges.find(e => 
          e.source === node.id && 
          (e.sourceHandle === choiceHandleIdSource || e.sourceHandle === `choice-${choice.id}`)
        );

        const targetEdge = edges.find(e => 
          e.target === node.id && 
          e.targetHandle === choiceHandleIdTarget
        );

        let targetId = null;
        if (sourceEdge) targetId = sourceEdge.target;
        else if (targetEdge) targetId = targetEdge.source;

        return {
          id: choice.id.toString(),
          text: choice.text || "",
          targetNodeId: targetId,
        };
      });

      return {
        nodeId: node.id,
        title: data.title || "Untitled Scene",
        content: data.content || "",
        character: data.character || "",
        characterSprite: data.characterSprite || "",
        color: data.color || "#10b981",
        typeLabel: data.typeLabel || "Scene",
        backgroundImage: data.scenes?.[0]?.image || "",
        previousNodeId,
        nextNodeId,
        choices,
        position: node.position || { x: 0, y: 0 },
      };
    });

    const chapterData = {
      title: chapter.title || "Untitled Chapter",
      description: chapter.summary || "",
      project: projectId,
      nodeId: chapter.id,
      color: chapter.color || "#6366f1",
      scenes,
    };
    
    return Chapter.findOneAndUpdate(
      { project: projectId, nodeId: chapter.id },
      chapterData,
      { upsert: true, new: true }
    );
  });
  
  await Promise.all(upsertPromises);

  // Return counts so they can be saved in the Project model
  return { nodeCount, sceneCount, choiceCount };
};

const getChaptersByProject = async (req, res) => {
  try {
    const chapters = await Chapter.find({ project: req.params.projectId });
    return successResponse(res, "Chapters fetched.", { chapters });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getChapterByNodeId = async (req, res) => {
  try {
    const chapter = await Chapter.findOne({ project: req.params.projectId, nodeId: req.params.nodeId });
    if (!chapter) return errorResponse(res, "Chapter not found.", 404);
    return successResponse(res, "Chapter fetched.", { chapter });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  syncChapters,
  getChaptersByProject,
  getChapterByNodeId
};
