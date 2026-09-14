import React from 'react';
import { Button, IconButton, ButtonGroup, Dialog, Menu, MenuItem, Text, ConfirmationDialog } from './ui';

export function Good() {
  return (
    <>
      <ButtonGroup>
        <Button variant="primary">Save</Button>
        <Button variant="danger">Delete</Button>
        <ConfirmationDialog title="Confirm delete" />
        <IconButton aria-label="More actions" icon={Kebab} />
        <IconButton aria-label="Overflow menu" icon={Dots} />
      </ButtonGroup>

      <Menu>
        <MenuItem>Profile</MenuItem>
        <MenuItem>Settings</MenuItem>
      </Menu>

      <Dialog title="Details">
        <Text>Read only content</Text>
      </Dialog>

      <form>
        <Button type="submit">Send</Button>
      </form>

      <Button loading>Saving</Button>

      <Dialog.Footer>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">OK</Button>
      </Dialog.Footer>
    </>
  );
}
