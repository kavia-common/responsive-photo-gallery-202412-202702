import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders photo gallery header", () => {
  render(<App />);
  expect(screen.getByText(/photo gallery/i)).toBeInTheDocument();
});
