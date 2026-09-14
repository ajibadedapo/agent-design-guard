import React from 'react';
import { Button, IconButton, ButtonGroup, Dialog, Menu, MenuItem, Link, ConfirmationDialog } from './ui';

export function Bad() {
  return (
    <>
      <ButtonGroup>
        <Button variant="primary">Save</Button>
        <Button variant="primary">Publish</Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="primary">Save</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="danger">Purge</Button>
        <ConfirmationDialog title="Are you sure?" />
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="primary">Save</Button>
        <Button variant="danger">Delete</Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="primary">Save</Button>
        <IconButton aria-label="More" icon={Kebab} />
        <IconButton aria-label="More" icon={Kebab} />
      </ButtonGroup>

      <MenuItem>Profile</MenuItem>

      <Dialog title="Information">
        <Link href="/home">Back to home</Link>
      </Dialog>

      <Button type="submit">Send</Button>

      <Button loading disabled>Saving</Button>

      <Dialog.Footer>
        <Button variant="primary">OK</Button>
        <Button variant="secondary">Cancel</Button>
      </Dialog.Footer>
    </>
  );
}
