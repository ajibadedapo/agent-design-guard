import React from 'react';
import {
  Box,
  Button,
  IconButton,
  ButtonGroup,
  Dialog,
  Link,
  Field,
  ConfirmDialog,
  TitleBar,
  PageActions,
  Text
} from './ui';

export function Bad() {
  return (
    <>
      <Box color="#B42318" />

      <button>Delete</button>

      <Button variant="frobnicate" label="Adjust" />

      <Button variant="danger" label="Remove" />

      <ButtonGroup>
        <Button variant="primary" label="Save" />
        <Button variant="primary" label="Publish" />
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="danger" reversible={false} requiresConfirmation label="Delete" />
      </ButtonGroup>

      <Dialog.Footer>
        <Button variant="primary" label="Submit order" />
        <Button variant="secondary" label="Cancel" />
      </Dialog.Footer>

      <Dialog title="Information">
        <Link href="/home" label="Home" />
      </Dialog>

      <ButtonGroup>
        <Button variant="secondary" size="md" label="One" />
        <Button variant="secondary" size="md" label="Two" />
        <Button variant="secondary" size="sm" label="Three" />
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="primary" label="Alpha" />
        <Button variant="ghost" label="Beta" />
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="secondary" label="OK" />
      </ButtonGroup>

      <Dialog title="Edit profile">
        <form>
          <Field label="Email" />
        </form>
      </Dialog>

      <ButtonGroup>
        <IconButton aria-label="More" />
        <IconButton aria-label="More" />
      </ButtonGroup>

      <TitleBar>
        <Button variant="primary" label="Save" />
      </TitleBar>
      <PageActions>
        <Button variant="primary" label="Publish" />
      </PageActions>
    </>
  );
}
