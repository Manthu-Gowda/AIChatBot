// Retrieve top-K chunks – stub returns summarized project fields
export async function retrieveContext(project: { name: string; role?: string | null; responsibilities?: string | null; description?: string | null }) {
  const bits = [
    `Project: ${project.name}`,
    project.role ? `Role: ${project.role}` : '',
    project.responsibilities ? `Responsibilities: ${project.responsibilities}` : '',
    project.description ? `Description: ${project.description}` : '',
  ].filter(Boolean)
  return bits.join('\n')
}

