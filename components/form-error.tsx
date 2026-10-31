/**
 * Shows an error that concerns the whole form, such as a failed save.
 *
 * @param message The error message, or undefined to show nothing.
 */
export function FormError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }
  return (
    <p role="alert" className="font-medium text-destructive">
      {message}
    </p>
  );
}
