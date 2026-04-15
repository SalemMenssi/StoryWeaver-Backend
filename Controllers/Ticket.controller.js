const Ticket = require("../Model/Ticket.model");
const User   = require("../Model/User.modal");
const { successResponse, errorResponse } = require("../Utils/apiResponse");

// ── ADMIN/MODERATOR ───────────────────────────────────────────────

const getAllTickets = async (req, res) => {
  try {
    const { status, tag, priority, search, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status)   query.status   = status;
    if (tag)      query.tag      = tag;
    if (priority) query.priority = priority;
    if (search) query.$or = [
      { title:    { $regex: search, $options: "i" } },
      { ticketId: { $regex: search, $options: "i" } },
    ];

    const total   = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .populate("owner",      "name email avatar")
      .populate("assignedTo", "name email")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse(res, "Tickets fetched.", {
      tickets,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updates = { status };
    if (status === "Closed") updates.resolvedAt = new Date();

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("owner", "name email");
    if (!ticket) return errorResponse(res, "Ticket not found.", 404);
    return successResponse(res, `Ticket marked as ${status}.`, { ticket });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const assignTicket = async (req, res) => {
  try {
    const { agentId } = req.body;
    const agent = await User.findById(agentId);
    if (!agent) return errorResponse(res, "Agent not found.", 404);

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignedTo: agentId, status: "In Progress" },
      { new: true }
    ).populate("owner assignedTo", "name email");

    if (!ticket) return errorResponse(res, "Ticket not found.", 404);
    return successResponse(res, `Ticket assigned to ${agent.name}.`, { ticket });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const replyToTicket = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return errorResponse(res, "Message text required.", 400);

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return errorResponse(res, "Ticket not found.", 404);

    ticket.messages.push({ sender: "agent", text, senderRef: req.user._id });
    if (ticket.status === "Open") ticket.status = "In Progress";
    await ticket.save();

    return successResponse(res, "Reply sent.", { ticket });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getTicketStats = async (req, res) => {
  try {
    const [total, open, inProgress, closed] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: "Open" }),
      Ticket.countDocuments({ status: "In Progress" }),
      Ticket.countDocuments({ status: "Closed" }),
    ]);
    return successResponse(res, "Stats fetched.", {
      stats: { total, open, inProgress, closed },
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ── USER ──────────────────────────────────────────────────────────

const getMyTickets = async (req, res) => {
  try {
    const { status, tag } = req.query;
    const query = { owner: req.user._id };
    if (status) query.status = status;
    if (tag)    query.tag    = tag;

    const tickets = await Ticket.find(query)
      .populate("assignedTo", "name avatar")
      .sort("-createdAt");

    return successResponse(res, "Tickets fetched.", { tickets });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getTicketById = async (req, res) => {
  try {
    const filter = req.user.role === "admin" || req.user.role === "moderator"
      ? { _id: req.params.id }
      : { _id: req.params.id, owner: req.user._id };

    const ticket = await Ticket.findOne(filter)
      .populate("assignedTo", "name avatar")
      .populate("owner", "name email");

    if (!ticket) return errorResponse(res, "Ticket not found.", 404);
    return successResponse(res, "Ticket fetched.", { ticket });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const createTicket = async (req, res) => {
  try {
    const { title, description, tag, priority } = req.body;
    const ticket = await Ticket.create({
      title, description, tag, priority,
      owner: req.user._id,
    });
    return successResponse(res, "Ticket created.", { ticket }, 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return errorResponse(res, "Message text required.", 400);

    const ticket = await Ticket.findOne({ _id: req.params.id, owner: req.user._id });
    if (!ticket) return errorResponse(res, "Ticket not found.", 404);
    if (ticket.status === "Closed")
      return errorResponse(res, "Cannot message on a closed ticket.", 400);

    ticket.messages.push({ sender: "user", text, senderRef: req.user._id });
    await ticket.save();

    return successResponse(res, "Message sent.", { ticket });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const deleteTicket = async (req, res) => {
  try {
    const filter = req.user.role === "admin" || req.user.role === "moderator"
      ? { _id: req.params.id }
      : { _id: req.params.id, owner: req.user._id };

    const ticket = await Ticket.findOneAndDelete(filter);
    if (!ticket) return errorResponse(res, "Ticket not found.", 404);
    return successResponse(res, "Ticket deleted.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getDirectChat = async (req, res) => {
  try {
    let targetUserId = req.user._id;
    if (req.user.role === "admin" || req.user.role === "moderator") {
      if (req.params.userId && req.params.userId !== "undefined" && req.params.userId !== "me") {
        targetUserId = req.params.userId;
      }
    }
    let ticket = await Ticket.findOne({ owner: targetUserId, tag: "DIRECT_CHAT" }).populate("owner", "name avatar");
    if (!ticket) {
      ticket = await Ticket.create({
        title: "Direct Chat",
        tag: "DIRECT_CHAT",
        owner: targetUserId,
      });
      ticket = await ticket.populate("owner", "name avatar");
    }
    // Also populate message senders 
    await ticket.populate("messages.senderRef", "name avatar");
    
    return successResponse(res, "Chat fetched.", { ticket });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const sendDirectMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return errorResponse(res, "Message text required.", 400);

    let targetUserId = req.user._id;
    if (req.user.role === "admin" || req.user.role === "moderator") {
      if (req.params.userId && req.params.userId !== "undefined" && req.params.userId !== "me") {
        targetUserId = req.params.userId;
      }
    }
    
    let ticket = await Ticket.findOne({ owner: targetUserId, tag: "DIRECT_CHAT" });
    if (!ticket) {
      ticket = await Ticket.create({
        title: "Direct Chat",
        tag: "DIRECT_CHAT",
        owner: targetUserId,
      });
    }

    const senderType = (req.user.role === "admin" || req.user.role === "moderator") ? "agent" : "user";
    ticket.messages.push({ sender: senderType, text, senderRef: req.user._id });
    ticket.status = "In Progress";
    await ticket.save();

    await ticket.populate("owner", "name avatar");
    await ticket.populate("messages.senderRef", "name avatar");

    return successResponse(res, "Message sent.", { ticket });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  getAllTickets, updateTicketStatus, assignTicket,
  replyToTicket, getTicketStats,
  getMyTickets, getTicketById, createTicket,
  sendMessage, deleteTicket,
  getDirectChat, sendDirectMessage
};