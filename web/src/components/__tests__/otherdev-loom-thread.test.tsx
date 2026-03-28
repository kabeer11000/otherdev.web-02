import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtherDevLoomThread } from "../otherdev-loom-thread";

jest.mock("@ai-sdk/react", () => ({
  useChat: jest.fn(() => ({
    messages: [],
    sendMessage: jest.fn(),
    status: "ready",
    setMessages: jest.fn(),
  })),
  DefaultChatTransport: jest.fn().mockImplementation((config) => config),
}));

describe("OtherDevLoomThread", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders FileAttachmentButton component", () => {
    render(<OtherDevLoomThread setActiveArtifact={jest.fn()} />);
    const attachmentButton = screen.getByLabelText(/attach file/i);
    expect(attachmentButton).toBeInTheDocument();
  });

  it("renders VoiceRecorderButton component", () => {
    render(<OtherDevLoomThread setActiveArtifact={jest.fn()} />);
    const voiceButton = screen.getByLabelText(/record voice message/i);
    expect(voiceButton).toBeInTheDocument();
  });

  it("displays FilePreview when files are attached", async () => {
    const user = userEvent.setup();
    render(<OtherDevLoomThread setActiveArtifact={jest.fn()} />);

    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/test.txt/)).toBeInTheDocument();
    });
  });

  it("allows removing attached files", async () => {
    const user = userEvent.setup();
    render(<OtherDevLoomThread setActiveArtifact={jest.fn()} />);

    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/test.txt/)).toBeInTheDocument();
    });

    const removeButton = screen.getByLabelText(/remove test.txt/i);
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText(/test.txt/)).not.toBeInTheDocument();
    });
  });

  it("allows clearing all attached files", async () => {
    const user = userEvent.setup();
    render(<OtherDevLoomThread setActiveArtifact={jest.fn()} />);

    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/test.txt/)).toBeInTheDocument();
    });

    const clearButton = screen.getByText(/clear/i);
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByText(/test.txt/)).not.toBeInTheDocument();
    });
  });

  it("disables buttons while processing files", async () => {
    const user = userEvent.setup();
    render(<OtherDevLoomThread setActiveArtifact={jest.fn()} />);

    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/send files/i)).toBeInTheDocument();
    });

    const sendButton = screen.getByText(/send files/i);
    expect(sendButton).not.toBeDisabled();
  });
});
