import { createFileRoute } from "@tanstack/react-router";
import { Button } from "antd";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div>
      <p>Hello, World!</p>
      <Button>Click me</Button>
    </div>
  );
}
